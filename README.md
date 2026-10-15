# 晶片研發 AI 使用體驗調查 v4

面向 RTL、DV、Formal、EDA、韌體與 SoC 工程師的四階段問卷。收集實際工具、模型、服務通路、工作瓶頸與已嘗試的改善方法，並在填答時提供說明。管理者可查看部門統計及匯出 CSV。

## v4 修改

- 將模型名稱與服務通路分開：供應商商業服務、Databricks、OpenRouter、其他外部代管、公司 On-prem、內部入口後端不詳、未知及未使用。
- 明確記錄「最常用模型 × 主要通路」。不將多選題的所有模型與通路自動交叉配對。
- 說明商業閉源服務、開放權重模型商業代管與公司自建模型的成本；開放權重不代表推論免費，沒有個人扣款不代表沒有公司成本。
- 新增成本認知題，補充模型授權、公司政策、Context、成功率、重試及整體任務成本的觀念。不收金額或個人 Token 用量。
- 全部原生下拉選單改為頁面內展開清單，使用原生 `details/summary` 與 radio；支援鍵盤、Escape 關閉，選擇後收起。
- 保留切換頁面前的選擇；取消勾選的項目會從對應主要選單移除。修正選滿三項障礙時無法切換至「沒有顯著障礙」的情況。
- 後端加入通路統計、成本認知與主要模型／通路組合；舊 SQLite 資料庫自動增加欄位，原紀錄保留，不推測歷史通路。
- 修正 SQLite 連線未明確關閉的問題。

模型以系列分類，不宣稱特定版本永遠較便宜或適合某項任務。請依公司核准清單與實際工作驗收結果調整 `app.js`。

## 啟動

需要 Python 3.10 以上，伺服器不需第三方套件。

Windows PowerShell：

```powershell
$env:SURVEY_ADMIN_KEY = Read-Host '設定管理者金鑰'
py server.py
```

Linux / macOS：

```sh
export SURVEY_ADMIN_KEY='請自行設定強密碼'
python3 server.py
```

- 問卷：<http://127.0.0.1:8765/>
- 統計：<http://127.0.0.1:8765/admin>
- 停止：在伺服器終端按 Ctrl+C。

也可直接開啟 `index.html` 操作離線預覽；提交與集中收件須啟動伺服器。

`SURVEY_HOST` 預設 `127.0.0.1`、`SURVEY_PORT` 預設 `8765`、`SURVEY_DB` 預設程式目錄的 `survey_data.sqlite3`。正式內網收件請經公司核准並使用 HTTPS／SSO 反向代理。

## 資料與升級

不要求姓名、工號、帳號、憑證、精確用量或專案機密。請勿在自由文字填入可識別資訊或機密內容。伺服器不保留 IP、User-Agent、Cookie 存取紀錄；代理或 SSO 仍可能有自己的紀錄。統計 API 不回傳自由文字，CSV 僅供管理者。

舊版升級前先停止服務並備份資料庫，再以新版啟動。舊紀錄的通路欄位會是空白，管理頁顯示「舊版未填答」；不會把舊版 `local_model` 自動轉成新通路。該模型代碼沿用，但舊版名稱為 On-prem，故歷史模型分布仍需配合舊版定義解讀。

本儲存庫只包含程式與測試，不包含資料庫、實際回覆或管理金鑰。`.gitignore` 排除這些執行期資料。這是部門試行原型，未整合 SSO、角色權限、稽核及完整防濫用機制；GitHub 公開程式不等於已部署線上收件服務。

## 驗證

```sh
python -m unittest discover -s tests -v
node --check app.js
node --check admin.js
```

後端測試涵蓋 HTTP 提交／統計／CSV、管理權限、錯誤組合拒絕及 v3 資料遷移。另以瀏覽器實際完成四段填答，確認工具、模型、通路、額度、瓶頸、追問選單展開，以及返回後追問答案保留、成功提交與後端統計一致。

## 參考資料

2026-10-15 查閱，費用與可用模型仍依公司實際合約：

- [Databricks Foundation Model APIs](https://docs.databricks.com/aws/en/machine-learning/foundation-model-apis/)
- [OpenRouter pricing](https://openrouter.ai/pricing)
