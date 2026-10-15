import importlib.util
import json
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('survey', ROOT / 'server.py')
survey = importlib.util.module_from_spec(spec)
spec.loader.exec_module(survey)

def sample():
    return dict(task_area='rtl', mode='cli', ai_jobs=['code'], human_jobs=['review'],
                tools=['codex_cli'], primary_tool='codex_cli', models=['qwen'], primary_model='qwen',
                routes=['openrouter','onprem'], primary_route='openrouter', cost_awareness='quota_only',
                choose_basis='tested', routing_practice='some', costly_model='qwen', costly_task='rtl',
                barriers=['token'], top_barrier='token', tried_status={f'token_{i}':'not_tried' for i in range(3)},
                alternate_route='terminal', help_wanted=['modelmap'], volunteer='no', task_example='', extra='')

class ServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        survey.DB = Path(self.temp.name) / 'test.sqlite3'
        survey.SECRET = 'test-only-key'
        self.http = survey.ThreadingHTTPServer(('127.0.0.1',0), survey.Handler)
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.base = f'http://127.0.0.1:{self.http.server_port}'

    def tearDown(self):
        self.http.shutdown(); self.http.server_close(); self.thread.join()
        self.temp.cleanup()

    def request(self,path,data=None,admin=False):
        headers={'Authorization':'Bearer test-only-key'} if admin else {}
        if data is not None: headers['Content-Type']='application/json'
        req=Request(self.base+path, data=json.dumps(data).encode() if data is not None else None, headers=headers)
        try:
            with urlopen(req) as r: return r.status,r.read().decode()
        except HTTPError as e: return e.code,e.read().decode()

    def test_save_aggregate_export_and_admin_boundary(self):
        self.assertEqual(self.request('/api/responses',sample())[0],201)
        self.assertEqual(self.request('/api/stats')[0],403)
        self.assertEqual(self.request('/api/export')[0],403)
        status,body=self.request('/api/stats',admin=True)
        stats=json.loads(body)
        self.assertEqual(stats['count'],1)
        self.assertEqual(stats['routes'],{'openrouter':1,'onprem':1})
        self.assertEqual(stats['model_route_pairs'],[{'model':'qwen','route':'openrouter','count':1}])
        self.assertNotIn('task_example',stats)
        self.assertIn('cost_awareness',self.request('/api/export',admin=True)[1])

    def test_reject_inconsistent_routes_and_models(self):
        for changes in [dict(primary_route='databricks'),dict(routes=['none','openrouter']),dict(costly_model='deepseek'),dict(tried_status={'local_0':'unknown'}),dict(ai_jobs=[])]:
            data=sample();data.update(changes)
            self.assertEqual(self.request('/api/responses',data)[0],400,changes)

    def test_upgrade_preserves_legacy_record_without_inferred_route(self):
        with survey.connect() as cn:
            columns=[r[1] for r in cn.execute('PRAGMA table_info(responses)')]
        legacy=[c for c in columns if c not in ['id','routes','primary_route','cost_awareness']]
        data=sample();data['created_at']='2026-10-14T00:00:00Z'
        vals=[json.dumps(data[k]) if isinstance(data[k],(list,dict)) else data[k] for k in legacy]
        # Recreate v3's schema and a real old record, then trigger v4 migration.
        with sqlite3.connect(survey.DB) as cn:
            cn.execute('DROP TABLE responses')
            cn.execute('CREATE TABLE responses (id INTEGER PRIMARY KEY,'+','.join(f'{c} TEXT NOT NULL' for c in legacy)+')')
            cn.execute('INSERT INTO responses ('+','.join(legacy)+') VALUES ('+','.join('?' for _ in legacy)+')',vals)
        cn.close()
        with survey.connect(): pass
        rows=survey.rows_from_db()
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['primary_model'],'qwen')
        self.assertEqual(rows[0]['routes'],'[]');self.assertEqual(rows[0]['primary_route'],'')
        self.assertEqual(survey.stats()['model_route_pairs'],[])
        self.assertEqual(self.request('/api/responses',sample())[0],201)
        self.assertEqual(survey.stats()['count'],2)

if __name__=='__main__': unittest.main()
