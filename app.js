'use strict';
const $=id=>document.getElementById(id);
const D={
 tasks:[['arch','SoC 架構、需求與 IP 整合','規格分析、Bus / register map、子系統介面'],['rtl','RTL 設計與程式碼','SystemVerilog、模組修改、eFuse / CSR 邏輯'],['dv','DV / Formal / 模擬驗證','UVM、SVA、regression、coverage 與 debug'],['eda','EDA 流程與設計自動化','Lint、CDC/RDC、合成、PPA、STA 報告'],['fw','韌體、Driver、Bring-up','C/C++、寄存器存取、韌體測試程式'],['security','晶片資安與功能安全','TARA、Fault Injection、ASIL、資安驗證'],['pd','實體設計與 Sign-off','Floorplan、Timing Closure、DRC/LVS'],['docs','規格／Wiki／Review 與協作','設計文件、需求追溯、Review 意見'],['other','其他','']],
 modes:[['no','尚未固定使用','偶爾試用，還沒有放入實際工作'],['chat','Chatbot 問答','貼 RTL / log 片段，請 AI 解釋、修改或產生建議'],['ide','IDE / Editor 內輔助','例如在 VS Code 由外掛輔助修改 RTL 或 Python'],['cli','Agent Harness / CLI 委派','例如 Codex 或 Claude Code 讀取專案、修改程式並執行測試'],['workflow','多步驟 Agent 工作流','例如 Agent 讀規格、分析 RTL、跑模擬、根據結果修正'],['multi','多 Agent 或跨工具自動化','例如多 Agent 分別整理規格、執行 DV 與統整結果']],
 aijobs:[['search','找資料／解釋文件','整理規格、搜尋寄存器定義'],['draft','寫摘要／報告','review 摘要、debug 結論'],['code','產生／修改程式碼','RTL、SVA、Python、Firmware'],['analyze','分析 log 與問題','讀取 regression、lint、STA log'],['run','操作工具並執行','跑腳本、模擬或已授權的 EDA 工具'],['endtoend','完成可驗收的工作','從目標到結果，附工具輸出或測試證據'],['none','目前很少使用','']],
 humanjobs:[['goal','定義目標與限制','決定功能需求、成功標準'],['source','整理資料與環境','選擇正確 spec / RTL / 版本'],['review','審查正確性','檢查功能、安全與驗證證據'],['tool','手動操作工具','跑模擬、比較 log、送出工具指令'],['decision','架構取捨與決策','評估 PPA、風險、取捨'],['delivery','交付與簽核','最終審核、整合或 Tape-out 閘門']],
 barriers:[['token','Token 額度不足','例如 RTL 分析反覆重讀長規格，還沒跑到驗證就耗盡額度。'],['local','On-prem 模型品質／速度不足','例如本地模型讀 UVM log 太慢，或修改 SystemVerilog 經常出錯。'],['routing','不知道選哪個 Model','例如一律用高階模型摘要 lint log，不確定小模型是否足夠。'],['harness','不了解 Agent Harness 能力','例如知道 Chatbot 可改 code，卻不知道 Agent 能直接跑 testbench。'],['install','工具外掛／安裝受限','例如 VS Code 的 Claude Code 外掛裝不了，尚未確認 CLI 或桌面入口。'],['context','Context／規格／版本難管理','例如 eFuse spec、RTL 和 register map 版本不同，Agent 常引用錯誤來源。'],['quality','Agent 結果不穩定','例如生成 SVA 通過語法檢查，但未驗證原始安全性要求。'],['flow','不知道如何把工作交給 Agent','例如仍是問一句答一句，沒有完整的 RTL 修改到 regression 流程。'],['eda','EDA 工具或資料無法串接','例如 Agent 無法呼叫公司核准的模擬器／JasperGold，或無法取得結果。'],['vendor','商業模型服務速度／併發不足','例如大量平行 Agent 卡在請求速率限制，無法有效完成 regression 分析。'],['policy','公司政策／權限路徑不明','例如不知道哪些設計資料能送到核准的商業模型。'],['other','其他問題','可以在下面填寫具體情境。'],['none','目前沒有顯著障礙','你也可以分享已成功的晶片研發 AI 工作方法。']],
 helpwanted:[['modelmap','模型與任務成本對照','例如 log 摘要用小模型，安全架構推理用高階模型'],['harness_demo','Agent 工作流示例','例如 RTL 修改 → 模擬 → 證據整理'],['context','Context / 文件版本管理方法','例如指定權威規格與可重用工作狀態'],['eda','EDA / 模擬工具整合方式','例如透過已授權 CLI / MCP 呼叫工具'],['pilot','共同診斷真實案例','一起定位主要阻礙'],['budget','專案共同 Token 額度','對已驗證具價值的工作提供算力'],['it','部門統一向 IT 提需求','工具權限、供應商或吞吐量問題'],['community','交流與成功失敗案例','分享可重用工作方式']],
 volunteer:[['no','只提供本次匿名回覆','不參與後續案例討論'],['maybe','願意參與公開交流','例如聽取或分享匿名化經驗'],['yes','願意共同研究某個案例','由既有部門管道自願聯絡協調者，問卷不收聯絡資訊']],
 tools:[
 ['aido','AIDO（公司內部 AI 工具）','內部 Chatbot／AI 平台'],
 ['corpchat','公司 Chatbot／內部 AI 網頁','公司提供的統一聊天入口'],
 ['chatgpt_web','ChatGPT 網頁版','瀏覽器對話、貼 log／規格片段'],
 ['chatgpt_desktop','ChatGPT 桌面版','桌面應用程式'],
 ['claude_web','Claude 網頁版','一般對話介面'],
 ['claude_desktop','Claude Desktop','桌面應用程式'],
 ['claude_vscode','Claude Code＋ VS Code 外掛','在 VS Code 內進行代理編碼'],
 ['claude_terminal','Claude Code Terminal／CLI','在 Terminal 直接操作 repo、腳本、工具'],
 ['codex_vscode','Codex ＋ VS Code 擴充功能','在編輯器中執行開發任務'],
 ['codex_cli','Codex CLI／Terminal','由命令列讀取 repo、編輯與跑測試'],
 ['codex_desktop','Codex 桌面版','桌面入口'],
 ['copilot_vscode','VS Code ＋ Copilot／其他 AI 外掛','一般 IDE 內建建議與對話'],
 ['cursor','Cursor（IDE 或 CLI）','整合編輯器與程式碼代理'],
 ['gemini_cli','Gemini CLI／其他 CLI Agent','命令列 AI Agent'],
 ['onprem','公司 On-prem 模型入口','本地模型服務、API 或內部前端'],
 ['other','其他已核准工具','例如其他內部工具或 Agent 平台'],
 ['none','目前還沒有固定使用','尚未找到適合的入口']],
 models:[
 ['gpt_high','GPT 高階模型','較複雜推理、架構規劃、Debug'],
 ['gpt_light','GPT 輕量模型','小型修改、分類、摘要'],
 ['claude_opus','Claude Opus 系列','高階工作／複雜開發任務'],
 ['claude_sonnet','Claude Sonnet 系列','程式碼與 Agent 任務；版本以實際入口顯示為準'],
 ['claude_haiku','Claude Haiku 系列','較小型任務；價格依版本與通路而異'],
 ['deepseek','DeepSeek 系列','請依實際模型名稱辨識；可由外部或內部服務提供'],
 ['qwen','Qwen 系列','請依實際模型名稱辨識；可由外部或內部服務提供'],
 ['gemini_pro','Gemini Pro 系列','高階推理與長 Context'],
 ['gemini_flash','Gemini Flash 系列','低延遲與批次任務'],
 ['grok','Grok 系列','其他商用模型'],
 ['local_model','內部服務的模型名稱不詳','僅知道使用內部服務；部署位置請在下一題另外填寫'],
 ['auto','不確定／由 AIDO 或平台自動選擇','不知道背後實際模型'],
 ['none','尚未使用模型','目前未使用 AI']],
 routes:[
 ['vendor','模型供應商的商業服務','例如供應商 API、ChatGPT／Claude 訂閱服務；可能依 Token、訂閱或合約計費'],
 ['databricks','Databricks 平台服務','可使用平台代管模型或串接外部模型；成本可能來自 Token 或保留的服務容量'],
 ['openrouter','OpenRouter 平台服務','透過平台取得不同模型與供應商的推論服務；開放權重模型也可能按使用量收費'],
 ['other_hosted','其他外部代管／雲端服務','模型在外部服務執行；費用與資料處理方式依公司合約'],
 ['onprem','公司 On-prem 自行部署','模型在公司自有環境執行；仍有 GPU、電力、維運、容量與授權成本'],
 ['internal_unknown','公司內部入口，但不清楚後端','AIDO／公司 Chatbot 是入口，無法據此判斷模型是否 On-prem'],
 ['unknown','不知道服務通路','無需猜測，也不要求提供帳單或 API 設定'],
 ['none','尚未使用','目前未使用模型服務']],
 costAwareness:[
 ['known','知道成本主要來自哪裡','能區分訂閱、Token 計費、平台容量或公司算力成本'],
 ['quota_only','只看得到工具額度','不清楚背後由哪種方式計費'],
 ['not_visible','沒有看到個人扣款／額度','公司統一承擔；這不代表服務沒有成本'],
 ['unknown','不清楚／尚未使用','希望有簡單的成本與通路說明']],
 chooseBasis:[
 ['default','使用工具預設模型','沒有特別修改'],
 ['best','優先選效果最好的高階模型','不太考慮成本'],
 ['cost','優先選比較便宜的模型','能做完工作即可'],
 ['speed','依回應速度或限制選擇','避免排隊或速率限制'],
 ['tested','比較過不同模型的成果與成本','用任務結果挑選'],
 ['unsure','不知道怎麼選擇','目前缺少選型資訊']],
 routingPractice:[
 ['yes','有，依任務分流','例如 log 摘要用低價模型，架構判斷用高階模型'],
 ['some','部分有，但還沒有固定方法','偶爾更換模型'],
 ['no','沒有，幾乎固定使用同一模型','所有任務使用同樣配置'],
 ['unknown','無法選擇或不知道模型名稱','由工具或 AIDO 決定']],
 costlyTask:[
 ['rtl','RTL 產生／修改／Debug','例如 SystemVerilog、CSR／eFuse'],
 ['verification','DV／UVM／SVA／Formal','testbench、coverage、assertion'],
 ['logs','EDA 報告與大量 Log 分析','regression、STA、Lint、CDC'],
 ['spec','規格、Wiki、長 Context 檢索','Spec 比對、register map、設計文件'],
 ['fw','Firmware／Driver／Bring-up','C/C++、寄存器存取、測試程序'],
 ['agents','長時間 Agent 或多 Agent 重試','自主執行、重複探索、協作'],
 ['chat','日常 Chatbot 對話／報告','摘要、郵件、文件整理'],
 ['unknown','不清楚主要耗在哪裡','無法看到模型或任務成本']],
 alternateRoute:[
 ['not_affected','沒有遇到外掛或入口受限','目前可正常使用'],
 ['terminal','已試過核准的 Terminal／CLI','例如 Claude Code Terminal、Codex CLI'],
 ['desktop','已試過核准的桌面版或網頁版','例如 ChatGPT Desktop、Claude Desktop'],
 ['other_tool','改用其他核准工具','例如 Codex 取代某個 IDE 外掛'],
 ['not_tried','還沒試過其他入口','尚不清楚替代方法'],
 ['all_blocked','試過替代方式，但功能或權限仍受限','可向 IT 說明具體缺少的能力'],
 ['unknown','不清楚公司核准哪些入口','需要核准工具清單']]
};
const GUIDES={
 token:{title:'Token 不足：有沒有可能先改變算力的使用方式？',story:'例：Agent 每次分析 eFuse secure boot 的 RTL，都把整份規格及歷史 log 重送給最高價模型，結果額度先耗盡。',questions:['你有沒有看過，哪一段任務最耗 Token？是重讀規格、反覆 debug，還是最終判斷？','你試過把 log 摘要、程式碼定位交給經核准的小模型，保留高階模型做架構判斷嗎？','你試過縮小 Context，只帶入正確版本的規格、RTL 與上次工具驗證結果嗎？'],tip:'若模型分流與 Context 精簡後仍無法完成，可將實際工作負載整理成專案額度需求。'},
 local:{title:'本地模型：速度和成功率，哪個才是瓶頸？',story:'例：本地模型沒有向個人扣款，但公司仍負擔算力與維運；讀取大型 regression log 要排隊，定位 root cause 經常失準。',questions:['是否比較過同一份 log 在本地模型與經核准的低價商業模型的完成率？','你遇到的是等待算力、模型無法理解 RTL，還是工具串接限制？','是否嘗試先縮小工作範圍，將 log 分類與摘要交給本地模型？'],tip:'先建立具體工作、總耗時、成功率的對照，再判斷是更換模型、商用服務或要求 IT 擴容。'},
 routing:{title:'模型選擇：高價模型真的需要處理每一個步驟嗎？',story:'例：把每日 lint / regression log 的固定格式摘要全部送到最貴模型，和複雜的功能安全故障推理使用相同配置。',questions:['你有分開 log 分類、規格檢索、RTL 產生、架構評估這幾種工作嗎？','試過讓便宜模型先整理證據，再由高階模型判斷例外案例嗎？','你有比較整個任務的完成成本，而不只是單次回應的模型品質嗎？'],tip:'可以形成部門任務對照表，標記模型、成本與可靠性；不必要求每個人自己重做比較。'},
 harness:{title:'Agent Harness：是否只把它當成能對話的編輯器？',story:'例：把 UVM 錯誤 log 複製到 Chatbot 問如何修復，但從未讓 Codex / Claude Code 讀相關檔案、修改測試並執行已核准 simulator。',questions:['是否曾讓 Harness 在核准工作區直接讀 RTL、寫測試，並收集工具執行結果？','目前你知道的介面只有 VS Code 外掛，還是也了解 Terminal / CLI、桌面版本的能力？','是否能定義一個可以驗收的完整工作，例如修正 assertion 並附上模擬結果？'],tip:'先實作一條簡單、可交付的流程，不需要一開始就設計複雜的多 Agent 系統。'},
 install:{title:'安裝問題：特定入口受限，工作本身就無法做了嗎？',story:'例：VS Code 上的 Claude Code 外掛受公司限制，但同一套已核准服務可能另有 Terminal / CLI 或桌面介面。',questions:['受限的是「VS Code 外掛」，還是工具本身、帳號、存取權限或服務都未獲核准？','你查過公司核准的 Terminal / CLI 或桌面版是否能完成同樣的 RTL 操作嗎？','如果替代入口功能不等價，真正缺少的是檔案操作、工具執行、登入還是網路權限？'],tip:'先列出可核准的替代路徑；若依規定都不能用，彙整具體缺口向 IT 提需求，不私自繞過政策。'},
 context:{title:'Context：Agent 拿到的是正確工作狀態嗎？',story:'例：要分析某個 register 的 secure boot bit，但 Agent 引用了舊版 spec、錯誤 module 與過期的測試結果。',questions:['你有先標記規格、RTL、register map 的版本與權威來源嗎？','Agent 是否能取得工具產生的真實結果，而不只看另一段 AI 生成摘要？','是否讓 Agent 保留已核對的狀態，避免每輪都從頭搜尋？'],tip:'先解決證據與版本問題，可能比增加模型大小或 Context 長度更有效。'},
 quality:{title:'結果不穩定：問題出在模型，還是沒有驗收邊界？',story:'例：Agent 生成多個 SVA，形式上完成，但實際沒有覆蓋原先的安全要求，還反覆主張擴充測試框架。',questions:['在開始前，有沒有定義成功標準與需要的工具驗證證據？','能不能指出失敗來自規格理解、工具輸出、RTL 修改，或超出工作範圍？','Agent 提議增加測試、重構或探索時，是否要求其證明對原始任務有直接必要？'],tip:'優先完成原始意圖與最小必要驗證，防止工作無限擴張而耗盡成本。'},
 flow:{title:'工作流：能不能從「問問題」進到「交付一段工作」？',story:'例：工程師每天要手動彙整 DV regression、定位失敗測試、更新 Jira/Wiki，Agent 目前只協助寫摘要。',questions:['AI 現在只給建議，還是能真的執行從讀 log 到問題定位的一段流程？','哪些決策仍需工程師負責？Agent 可否直接處理可重複、可驗收的步驟？','你有替這段流程定義結束條件，避免 Agent 持續重跑或擴充無關任務嗎？'],tip:'先挑一段有明確輸入輸出、能夠量測品質的流程，嘗試完整委派。'},
 eda:{title:'EDA 整合：缺少的是模型能力，還是工具操作權？',story:'例：Agent 能閱讀 RTL 並提出修改，但無法透過既有授權呼叫 simulator、formal tool 或取得 timing report，因此無法閉環驗證。',questions:['目前 Agent 能否在已核准的環境執行 EDA 命令與取得 exit code / log？','是否已有可以重用的腳本、CLI、內部服務或工具接口？','欠缺的是 license、路徑、權限、介面，還是格式化工具輸出？'],tip:'先釐清現有授權工具的合法接口，再提出最小的 IT / EDA 整合需求。'},
 vendor:{title:'供應商限制：是真正算力不足，還是工作重試太多？',story:'例：多個 Agent 平行分析 regression，每個都重送相同的 Context，最後觸發 API rate limit，整個工作反而變慢。',questions:['有沒有區分模型本身慢、排隊、服務速率限制和無效重試？','是否測試較低成本模型或較少平行工作，結果反而更快完成？','有沒有可以提供 IT 的具體情境，例如平均等待時間與成功率？'],tip:'若確認是服務端瓶頸，可提供匿名工作量與吞吐證據，請 IT 協調供應商。'},
 policy:{title:'政策不明：可以問得更具體',story:'例：不確定某份晶片 security spec 能否交給商業模型，因此 Agent 無法取得足夠脈絡。',questions:['能否指出資料分類、模型服務、工具或 API 哪一個環節的核准不清楚？','你是否看過公司已有的核准模型清單與資料使用原則？','能否提出一項不含機密的工作案例，讓 IT 回答可行路徑？'],tip:'要求清楚的決策邊界與替代方式，並保留資料與系統的原有權限控制。'},
 other:{title:'其他問題：從可重現的工作情境開始',story:'例：Agent 能做技術分析，但跨 Wiki、RTL repo 與內部工單的工作沒有共同入口。',questions:['這個問題可以用一個具體、非機密的工作案例說明嗎？','若只有一個條件可以先改變，會希望是哪個？','能否定義成功後的可驗收結果？'],tip:'先確認問題屬於模型、工具、資料、資源還是流程，再選擇處理方式。'},
 none:{title:'目前沒有明顯障礙：分享一種已有效的做法',story:'例：你已經能讓 Agent 完成規格比對、修正測試，並附上成功的模擬證據。',questions:['是否有一個可以匿名化分享的成功案例？','有哪些成功條件與限制，別人需要預先知道？','哪些操作方法能重用，讓同事不必從頭探索？'],tip:'成功經驗也可成為團隊共用資產。'}
};
let page=1;
function opts(id,items,type,name){const el=$(id);el.replaceChildren();items.forEach(([value,title,example])=>{const lbl=document.createElement('label');lbl.className='option';const inp=document.createElement('input');inp.type=type;inp.name=name;inp.value=value;const holder=document.createElement('span');const b=document.createElement('b');b.textContent=title;holder.append(b);if(example){const small=document.createElement('small');small.textContent=example;holder.append(small);}lbl.append(inp,holder);el.append(lbl);});}
opts('tasks',D.tasks,'radio','task_area');opts('modes',D.modes,'radio','mode');opts('aijobs',D.aijobs,'checkbox','ai_jobs');opts('humanjobs',D.humanjobs,'checkbox','human_jobs');opts('barriers',D.barriers,'checkbox','barriers');opts('helpwanted',D.helpwanted,'checkbox','help_wanted');opts('volunteer',D.volunteer,'radio','volunteer');opts('tools',D.tools,'checkbox','tools');opts('models',D.models,'checkbox','models');opts('chooseBasis',D.chooseBasis,'radio','choose_basis');opts('routingPractice',D.routingPractice,'radio','routing_practice');opts('alternateRoute',D.alternateRoute,'radio','alternate_route');opts('costlyTask',D.costlyTask,'radio','costly_task');
function checked(name){return [...document.querySelectorAll('input[name="'+name+'"]:checked')].map(e=>e.value)}
function selected(name){return checked(name)[0]||''}
function cap(name,max){document.querySelectorAll('input[name="'+name+'"]').forEach(el=>el.addEventListener('change',()=>{if(checked(name).length>max && el.checked && el.value!=='none') el.checked=false;if(name==='barriers'){if(el.value==='none'&&el.checked){document.querySelectorAll('input[name="barriers"]').forEach(e=>{if(e.value!=='none')e.checked=false})}else if(el.checked && el.value!=='none'){const n=document.querySelector('input[name="barriers"][value="none"]');n.checked=false}updateTop();}}));}
cap('barriers',3);cap('tools',17);cap('models',13);cap('help_wanted',3);cap('ai_jobs',7);cap('human_jobs',6);
// In-flow disclosure with native radio controls: no OS popup or clipping overlay.
function setPicker(id,items,placeholder){
 const holder=$(id),current=holder.querySelector('input[type=hidden]')?.value||'';
 const value=items.some(x=>x[0]===current)?current:'';
 holder.replaceChildren();
 const hidden=document.createElement('input');hidden.type='hidden';hidden.value=value;holder.append(hidden);
 const details=document.createElement('details');details.className='picker';
 const summary=document.createElement('summary');summary.textContent=(items.find(x=>x[0]===value)||[])[1]||placeholder;details.append(summary);
 const choices=document.createElement('div');choices.className='picker-options';
 if(!items.length){const p=document.createElement('p');p.textContent=placeholder;choices.append(p);}
 items.forEach(([key,title])=>{const label=document.createElement('label');label.className='option';
 const radio=document.createElement('input');radio.type='radio';radio.name='picker_'+id;radio.value=key;radio.checked=key===value;
 const text=document.createElement('span');text.textContent=title;label.append(radio,text);choices.append(label);
 radio.addEventListener('change',()=>{hidden.value=key;summary.textContent=title;details.open=false;summary.focus();holder.dispatchEvent(new Event('change',{bubbles:true}));});});
 details.append(choices);holder.append(details);
 details.addEventListener('keydown',e=>{if(e.key==='Escape'){details.open=false;summary.focus();}});
}
function pickerValue(id){return $(id).querySelector('input[type=hidden]')?.value||'';}
function updateTop(){const vals=checked('barriers');$('selectedCount').textContent=`已選 ${vals.length} / 3`;setPicker('top',D.barriers.filter(x=>vals.includes(x[0])),'請先勾選障礙，再點此選擇首要項目');}
function updatePrimary(listId,name,selectId,optsList){setPicker(selectId,optsList.filter(x=>checked(name).includes(x[0])),'請先勾選上方項目，再點此選擇');if(name==='models')updateCostlyModel();}
function updateCostlyModel(){setPicker('costlyModel',[['unknown','不知道／尚未能判斷'],['no_issue','目前沒有明顯額度壓力'],...D.models.filter(x=>checked('models').includes(x[0])&&!['none','auto'].includes(x[0]))],'點此選擇主要額度壓力來源');}
function checkExclusive(name,exclusive,cb){document.querySelectorAll('input[name="'+name+'"]').forEach(el=>el.addEventListener('change',()=>{if(el.checked&&el.value===exclusive)document.querySelectorAll('input[name="'+name+'"]').forEach(x=>{if(x!==el)x.checked=false});else if(el.checked){const e=document.querySelector('input[name="'+name+'"][value="'+exclusive+'"]');if(e)e.checked=false;}cb();}));}
checkExclusive('tools','none',()=>updatePrimary('tools','tools','primaryTool',D.tools));
checkExclusive('models','none',()=>updatePrimary('models','models','primaryModel',D.models));
opts('routes',D.routes,'checkbox','routes');opts('costAwareness',D.costAwareness,'radio','cost_awareness');
checkExclusive('routes','none',()=>setPicker('primaryRoute',D.routes.filter(x=>checked('routes').includes(x[0])),'請先勾選服務通路，再點此選擇'));
setPicker('primaryTool',[],'請先勾選工具，再點此選擇');setPicker('primaryModel',[],'請先勾選模型，再點此選擇');setPicker('primaryRoute',[],'請先勾選服務通路，再點此選擇');updateCostlyModel();updateTop();
const diagnosticAnswers={};
function pageShow(n){page=n;['part1','partTools','part2','part3'].forEach((v,i)=>$(v).classList.toggle('hide',i!==page-1));$('progress').style.width=(page*100/4)+'%';$('stepnote').textContent=`第 ${page} / 4 部分 · ${['工作與 AI 使用方式','實際使用的工具與模型','目前遇到的工作瓶頸','可行路徑與支援需求'][page-1]}`;$('prev').hidden=page===1;$('next').classList.toggle('hide',page===4);$('submit').classList.toggle('hide',page!==4);$('err').textContent='';window.scrollTo({top:0,behavior:'smooth'});if(page===4)renderGuide();}
function validatePage(){if(page===1){if(!selected('task_area')||!selected('mode'))return '請先選擇主要工作與目前使用方式。';if(!checked('ai_jobs').length || !checked('human_jobs').length)return '請選擇 AI 與人類目前負責的工作。';}if(page===2){if(!checked('tools').length||!pickerValue('primaryTool'))return '請選擇實際使用的工具及最常用的入口。';if(!checked('models').length||!pickerValue('primaryModel'))return '請選擇目前使用的模型及最常用的模型。';if(!checked('routes').length||!pickerValue('primaryRoute')||!selected('cost_awareness'))return '請選擇服務通路、最常用模型的主要通路與成本認知。';if(!selected('choose_basis')||!selected('routing_practice'))return '請回答目前選擇模型及模型分流的方式。';if(!pickerValue('costlyModel')||!selected('costly_task'))return '請選擇主要額度壓力的模型與工作類型。';}if(page===3){if(!checked('barriers').length || !pickerValue('top'))return '請先選擇障礙以及最想優先解決的一項。';}if(page===4){if(!selected('volunteer')||!selected('alternate_route'))return '請選擇替代入口使用情形與參與意願。';}return '';}
$('next').onclick=()=>{let err=validatePage();if(err){$('err').textContent=err;return}pageShow(page+1)};
$('prev').onclick=()=>pageShow(page-1);
function renderGuide(){const key=pickerValue('top')||'other',g=GUIDES[key],el=$('diagnostic');el.replaceChildren();const card=document.createElement('div');card.className='promptcard';const heading=document.createElement('h3');heading.textContent=g.title;card.append(heading);const story=document.createElement('p');story.className='small muted';story.textContent=g.story;card.append(story);const lead=document.createElement('div');lead.className='q';lead.textContent='這幾個可行路徑，你目前有嘗試過嗎？';card.append(lead);const ol=document.createElement('ol');g.questions.forEach((q,i)=>{const li=document.createElement('li');li.textContent=q;const picker=document.createElement('div');picker.id='diag_'+i;li.append(picker);ol.append(li);});card.append(ol);const tip=document.createElement('div');tip.className='tip';tip.textContent='可考慮的下一步：'+g.tip;card.append(tip);el.append(card);g.questions.forEach((q,i)=>{const id='diag_'+i;setPicker(id,[['unknown','不確定／目前無法判斷'],['not_tried','還沒有嘗試'],['tried_no','已嘗試，但沒有解決'],['worked_partial','試過，部分有效'],['cannot','因政策／環境限制無法嘗試']],'點此選擇嘗試情形');const saved=diagnosticAnswers[key+'_'+i];if(saved){const radio=$(id).querySelector('input[value="'+saved+'"]');if(radio){radio.checked=true;$(id).querySelector('input[type=hidden]').value=saved;$(id).querySelector('summary').textContent=radio.nextSibling.textContent;}}$(id).addEventListener('change',()=>diagnosticAnswers[key+'_'+i]=pickerValue(id));});}

$('survey').onsubmit=async e=>{e.preventDefault();let err=validatePage();if(err){$('err').textContent=err;return;}const data={schema_version:4,routes:checked('routes'),primary_route:pickerValue('primaryRoute'),cost_awareness:selected('cost_awareness'),task_area:selected('task_area'),mode:selected('mode'),ai_jobs:checked('ai_jobs'),human_jobs:checked('human_jobs'),tools:checked('tools'),primary_tool:pickerValue('primaryTool'),models:checked('models'),primary_model:pickerValue('primaryModel'),choose_basis:selected('choose_basis'),routing_practice:selected('routing_practice'),costly_model:pickerValue('costlyModel'),costly_task:selected('costly_task'),barriers:checked('barriers'),top_barrier:pickerValue('top'),tried_status:{},alternate_route:selected('alternate_route'),help_wanted:checked('help_wanted'),volunteer:selected('volunteer'),task_example:$('example').value,extra:$('extra').value};for(let i=0;i<3;i++)data.tried_status[data.top_barrier+'_'+i]=pickerValue('diag_'+i)||'unknown';
$('submit').disabled=true;$('err').textContent='';try{const resp=await fetch('/api/responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await resp.json();if(!resp.ok)throw Error(out.error||'無法送出');$('survey').classList.add('hide');$('success').classList.remove('hide');window.scrollTo(0,0);}catch(e){$('err').textContent='無法儲存回覆：'+e.message+'。若從本機直接開啟，請先啟動伺服器。';}finally{$('submit').disabled=false;}};
$('again').onclick=()=>location.reload();
if(location.protocol==='file:'){$('offline').classList.remove('hide');}
