# Streaming-and-service-discovery-project

這是一個運用 WebRTC + mDNS 改進 UPnP AV 架構的專案。

## 設定

在開始之前，請確保您已經完成以下步驟：

1. 安裝 Node.js：確保您已經安裝了最新版本的 Node.js。您可以在 [Node.js 官方網站](https://nodejs.org/) 下載並安裝。

2. 運行 Control Point：將 Control Point 檔案夾中的內容在您希望作為 Control Point 的設備上運行（本專案使用 Arduino）。Control Point 應該與 Media Renderer 連結，請確保將程式碼內容修改為連接的 USB Port 號。

3. 運行 Media Renderer：將 Media Renderer 檔案夾中的內容在您希望作為 Media Renderer 的設備上運行（本專案使用 Raspberry Pi）。

4. 運行 Media Server：將 Media Server 檔案夾中的內容在您希望作為 Media Server 的設備上運行（本專案使用 Windows 10）。

5. 在步驟 (2.)、(3.)、(4.) 的檔案中運行 `npm install`，以確保完整安裝相依套件。

## 開始使用

1. 在 Control Point 檔案夾中運行 `node control_point.js`，開啟 Control Point。

2. 在 Media Renderer 檔案夾中運行 `node view_back_end.js`，開啟 Media Renderer。

3. 在 Media Server 檔案夾中運行 `node push_back_end.js`，開啟 Media Server。

4. 在 Media Renderer 設備的瀏覽器中開啟 [http://127.0.0.1:3000/push_front_end.html](http://127.0.0.1:3000/push_front_end.html)。(推薦Edge/Chrome)

5. 在 Media Server 設備的瀏覽器中開啟 [http://127.0.0.1:3030/view_front_end.html](http://127.0.0.1:3030/view_front_end.html)。(推薦Edge/Chrome)

6. 觸發 Control Point，或利用 Media Server 的內建 UI 開啟影音串流。
