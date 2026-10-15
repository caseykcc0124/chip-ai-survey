#!/usr/bin/env python3
"""Chip AI Workflow Survey. Python 3.10+, no dependencies.
Run: SURVEY_ADMIN_KEY='a-long-random-secret' python3 server.py
Open http://127.0.0.1:8765/. Stores no sender IP/user-agent/cookies.
For network deployment place behind company SSO + HTTPS reverse proxy.
"""
import csv, datetime as dt, hmac, io, json, os, sqlite3, threading, time
from collections import Counter
from contextlib import contextmanager
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB = Path(os.environ.get('SURVEY_DB', ROOT / 'survey_data.sqlite3'))
HOST = os.environ.get('SURVEY_HOST', '127.0.0.1')
PORT = int(os.environ.get('SURVEY_PORT', '8765'))
SECRET = os.environ.get('SURVEY_ADMIN_KEY', '')
MAX_BODY = 16_384
LOCK = threading.Lock()
RECENT = {}  # ephemeral abuse protection, no IP persisted
CATEGORIES = {'token','local','routing','harness','install','context','quality','flow','policy','vendor','eda','other','none'}
TASKS = {'arch','rtl','dv','eda','fw','security','pd','docs','other'}
MODES = {'no','chat','ide','cli','workflow','multi'}
AI_JOBS = {'search','draft','code','analyze','run','endtoend','none'}
HUMAN_JOBS = {'goal','source','review','tool','decision','delivery'}
STATUS = {'not_tried','tried_no','worked_partial','cannot','unknown'}
HELP = {'modelmap','harness_demo','context','eda','pilot','budget','it','community'}
TOOLS = {'aido','corpchat','chatgpt_web','chatgpt_desktop','claude_web','claude_desktop','claude_vscode','claude_terminal','codex_vscode','codex_cli','codex_desktop','copilot_vscode','cursor','gemini_cli','onprem','other','none'}
MODELS = {'gpt_high','gpt_light','claude_opus','claude_sonnet','claude_haiku','deepseek','qwen','gemini_pro','gemini_flash','grok','local_model','auto','none'}
ROUTES = {'vendor','databricks','openrouter','other_hosted','onprem','internal_unknown','unknown','none'}
COST_AWARENESS = {'known','quota_only','not_visible','unknown'}
BASES = {'default','best','cost','speed','tested','unsure'}
ROUTING = {'yes','some','no','unknown'}
ALTERNATE = {'not_affected','terminal','desktop','other_tool','not_tried','all_blocked','unknown'}
COSTLY_TASK = {'rtl','verification','logs','spec','fw','agents','chat','unknown'}


@contextmanager
def connect():
    cn = sqlite3.connect(DB, timeout=10)
    cn.execute('PRAGMA journal_mode=WAL')
    cn.execute('''CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        task_area TEXT NOT NULL,
        mode TEXT NOT NULL,
        ai_jobs TEXT NOT NULL,
        human_jobs TEXT NOT NULL,
        barriers TEXT NOT NULL,
        top_barrier TEXT NOT NULL,
        tried_status TEXT NOT NULL,
        help_wanted TEXT NOT NULL,
        volunteer TEXT NOT NULL,
        task_example TEXT NOT NULL,
        extra TEXT NOT NULL,
        tools TEXT NOT NULL DEFAULT '[]',
        primary_tool TEXT NOT NULL DEFAULT '',
        models TEXT NOT NULL DEFAULT '[]',
        primary_model TEXT NOT NULL DEFAULT '',
        choose_basis TEXT NOT NULL DEFAULT '',
        routing_practice TEXT NOT NULL DEFAULT '',
        alternate_route TEXT NOT NULL DEFAULT '',
        costly_model TEXT NOT NULL DEFAULT '',
        costly_task TEXT NOT NULL DEFAULT ''
    )''')
    # Compatible upgrade from earlier local prototypes. Preserve existing records.
    existing={r[1] for r in cn.execute('PRAGMA table_info(responses)')}
    for col,defn in {'tools':"TEXT NOT NULL DEFAULT '[]'",'primary_tool':"TEXT NOT NULL DEFAULT ''",'models':"TEXT NOT NULL DEFAULT '[]'",'primary_model':"TEXT NOT NULL DEFAULT ''",'choose_basis':"TEXT NOT NULL DEFAULT ''",'routing_practice':"TEXT NOT NULL DEFAULT ''",'alternate_route':"TEXT NOT NULL DEFAULT ''",'costly_model':"TEXT NOT NULL DEFAULT ''",'costly_task':"TEXT NOT NULL DEFAULT ''",'routes':"TEXT NOT NULL DEFAULT '[]'",'primary_route':"TEXT NOT NULL DEFAULT ''",'cost_awareness':"TEXT NOT NULL DEFAULT ''"}.items():
        if col not in existing: cn.execute(f'ALTER TABLE responses ADD COLUMN {col} {defn}')
    try:
        with cn:
            yield cn
    finally:
        cn.close()


def check_str(s, length=250):
    return isinstance(s,str) and len(s) <= length and all(ord(c)>=32 or c in '\n\r\t' for c in s)


def text(s,length=250):
    if not check_str(s,length): raise ValueError('文字格式或長度不符')
    return s.strip()


def choice(s, allowed):
    if s not in allowed: raise ValueError('選項格式不正確')
    return s


def choices(v, allowed, limit=10):
    if not isinstance(v,list) or len(v)>limit or len(v)!=len(set(str(x) for x in v)) or any(x not in allowed for x in v):
        raise ValueError('多選欄位格式不正確')
    return v


def validate(d):
    if not isinstance(d,dict): raise ValueError('必須傳送 JSON 物件')
    barriers=choices(d.get('barriers'),CATEGORIES,3)
    if not barriers: raise ValueError('請選出至少一項阻礙')
    if 'none' in barriers and len(barriers)>1: raise ValueError('無阻礙不能與其他項目同選')
    top=choice(d.get('top_barrier'),CATEGORIES)
    if top not in barriers: raise ValueError('首要阻礙必須是已選項目')
    attempted=d.get('tried_status',{})
    if not isinstance(attempted,dict) or len(attempted)>5: raise ValueError('嘗試狀態格式不正確')
    if any(not isinstance(k,str) or not any(k==b+f'_{i}' for b in CATEGORIES for i in range(3)) or v not in STATUS for k,v in attempted.items()): raise ValueError('嘗試狀態選項不正確')
    tools=choices(d.get('tools'),TOOLS,17)
    models=choices(d.get('models'),MODELS,13)
    if not tools or ('none' in tools and len(tools)>1): raise ValueError('請確認工具選項')
    if not models or ('none' in models and len(models)>1): raise ValueError('請確認模型選項')
    primary_tool=choice(d.get('primary_tool'),TOOLS)
    primary_model=choice(d.get('primary_model'),MODELS)
    if primary_tool not in tools or primary_model not in models: raise ValueError('最常用的工具或模型必須是已勾選的項目')
    routes=choices(d.get('routes'),ROUTES,8)
    if not routes or ('none' in routes and len(routes)>1): raise ValueError('請確認服務通路選項')
    primary_route=choice(d.get('primary_route'),ROUTES)
    if primary_route not in routes: raise ValueError('主要通路必須是已勾選的項目')
    costly_model=choice(d.get('costly_model'),MODELS | {'unknown','no_issue'})
    if costly_model not in {'unknown','no_issue'} and costly_model not in models: raise ValueError('額度壓力模型必須是已勾選的模型')
    if not d.get('ai_jobs') or not d.get('human_jobs'): raise ValueError('請選擇 AI 與人類目前負責的工作')
    if set(attempted)!={top+f'_{i}' for i in range(3)}: raise ValueError('請回答首要瓶頸的三項嘗試情形')
    return {
        'routes':routes,
        'primary_route':primary_route,
        'cost_awareness':choice(d.get('cost_awareness'),COST_AWARENESS),
        'tools':tools,
        'primary_tool':primary_tool,
        'models':models,
        'primary_model':primary_model,
        'choose_basis':choice(d.get('choose_basis'),BASES),
        'routing_practice':choice(d.get('routing_practice'),ROUTING),
        'alternate_route':choice(d.get('alternate_route'),ALTERNATE),
        'costly_model':costly_model,
        'costly_task':choice(d.get('costly_task'),COSTLY_TASK),
        'task_area':choice(d.get('task_area'),TASKS),
        'mode':choice(d.get('mode'),MODES),
        'ai_jobs':choices(d.get('ai_jobs'),AI_JOBS,7),
        'human_jobs':choices(d.get('human_jobs'),HUMAN_JOBS,6),
        'barriers':barriers,
        'top_barrier':top,
        'tried_status':attempted,
        'help_wanted':choices(d.get('help_wanted'),HELP,3),
        'volunteer':choice(d.get('volunteer'),{'no','maybe','yes'}),
        'task_example':text(d.get('task_example',''),300),
        'extra':text(d.get('extra',''),300)
    }


def rows_from_db():
    with connect() as cn:
        rows=cn.execute('SELECT * FROM responses ORDER BY id DESC').fetchall()
    keys=['id','created_at','task_area','mode','ai_jobs','human_jobs','barriers','top_barrier','tried_status','help_wanted','volunteer','task_example','extra','tools','primary_tool','models','primary_model','choose_basis','routing_practice','alternate_route','costly_model','costly_task','routes','primary_route','cost_awareness']
    return [dict(zip(keys,r)) for r in rows]


def stats():
    rows=rows_from_db()
    def counter_single(col): return dict(Counter(row[col] for row in rows))
    def counter_multi(col):
        tally=Counter()
        for row in rows: tally.update(json.loads(row[col]))
        return dict(tally)
    return {'count':len(rows),'generated_at':dt.datetime.now(dt.timezone.utc).isoformat(),
            'task_area':counter_single('task_area'),'mode':counter_single('mode'),
            'barriers':counter_multi('barriers'),'top_barrier':counter_single('top_barrier'),
            'help_wanted':counter_multi('help_wanted'),'volunteer':counter_single('volunteer'),
            'tools':counter_multi('tools'),'primary_tool':counter_single('primary_tool'),
            'models':counter_multi('models'),'primary_model':counter_single('primary_model'),
            'choose_basis':counter_single('choose_basis'),'routing_practice':counter_single('routing_practice'),
            'alternate_route':counter_single('alternate_route'),
            'costly_model':counter_single('costly_model'),'costly_task':counter_single('costly_task'),
            'routes':counter_multi('routes'),'primary_route':counter_single('primary_route'),
            'cost_awareness':counter_single('cost_awareness'),
            'model_route_pairs':[{'model':m,'route':r,'count':n} for (m,r),n in Counter((row['primary_model'],row['primary_route']) for row in rows if row['primary_route']).items()],
            'tried_status':dict(Counter(k+':'+v for row in rows for k,v in json.loads(row['tried_status']).items()))}


class Handler(BaseHTTPRequestHandler):
    server_version='ChipAISurvey/1.0'
    def log_message(self,*_): pass  # no access logs or user identifiers
    def response(self,code,body,ctype='application/json; charset=utf-8'):
        if isinstance(body,dict): body=json.dumps(body,ensure_ascii=False).encode()
        if isinstance(body,str): body=body.encode()
        self.send_response(code)
        self.send_header('Content-Type',ctype)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)
    def forbidden(self): self.response(403,{'error':'需要管理者憑證'})
    def authorized(self):
        token=self.headers.get('Authorization','')
        return bool(SECRET) and hmac.compare_digest(token,'Bearer '+SECRET)
    def do_GET(self):
        path=urlparse(self.path).path
        static={'/':'index.html','/index.html':'index.html','/admin':'admin.html','/admin.html':'admin.html','/app.js':'app.js','/admin.js':'admin.js','/style.css':'style.css'}
        if path in static:
            filename=static[path]
            typ='text/css; charset=utf-8' if filename.endswith('.css') else ('text/javascript; charset=utf-8' if filename.endswith('.js') else 'text/html; charset=utf-8')
            self.response(200,(ROOT/filename).read_bytes(),typ);return
        if path == '/api/health': self.response(200,{'status':'ok','collection':True});return
        if path == '/api/stats':
            if not self.authorized(): self.forbidden();return
            self.response(200,stats());return
        if path == '/api/export':
            if not self.authorized(): self.forbidden();return
            output=io.StringIO();wr=csv.writer(output)
            keys=['id','created_at','task_area','mode','ai_jobs','human_jobs','barriers','top_barrier','tried_status','help_wanted','volunteer','task_example','extra','tools','primary_tool','models','primary_model','choose_basis','routing_practice','alternate_route','costly_model','costly_task','routes','primary_route','cost_awareness']
            wr.writerow(keys)
            for r in rows_from_db():
                # prevent spreadsheet formula interpretation on export
                wr.writerow(["'"+str(r[k]) if str(r[k]).lstrip().startswith(('=','+','-','@')) else r[k] for k in keys])
            self.response(200,output.getvalue(),'text/csv; charset=utf-8');return
        self.response(404,{'error':'not found'})
    def do_POST(self):
        if urlparse(self.path).path != '/api/responses': self.response(404,{'error':'not found'});return
        try:
            ln=int(self.headers.get('Content-Length','0'))
            if ln <= 0 or ln>MAX_BODY: self.response(413,{'error':'資料長度不合規'});return
            d=json.loads(self.rfile.read(ln))
            row=validate(d)
            stamp=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
            keys=['task_area','mode','ai_jobs','human_jobs','barriers','top_barrier','tried_status','help_wanted','volunteer','task_example','extra','tools','primary_tool','models','primary_model','choose_basis','routing_practice','alternate_route','costly_model','costly_task','routes','primary_route','cost_awareness']
            vals=[json.dumps(row[k],ensure_ascii=False) if isinstance(row[k],(list,dict)) else row[k] for k in keys]
            with LOCK,connect() as cn:
                cn.execute('INSERT INTO responses (created_at,'+','.join(keys)+') VALUES ('+','.join(['?']*(len(keys)+1))+')',[stamp]+vals)
            self.response(201,{'saved':True,'message':'回覆已成功送出。感謝分享。'})
        except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e:
            self.response(400,{'error':str(e)})
        except Exception:
            self.response(500,{'error':'伺服器暫時無法寫入回覆'})


if __name__=='__main__':
    with connect(): pass
    if not SECRET: print('警告：未設定 SURVEY_ADMIN_KEY，管理端將無法讀取任何資料。')
    print(f'問卷網址 http://{HOST}:{PORT}/ ；管理端 http://{HOST}:{PORT}/admin')
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
