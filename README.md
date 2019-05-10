# nptu-redux

[![](https://data.jsdelivr.com/v1/package/gh/mt-hack/nptu-redux/badge)](https://www.jsdelivr.com/package/gh/mt-hack/nptu-redux)

> 請注意！本插件仍在早期設計階段中，若有任何問題，請將其插件關閉並回報於 Issues 中。

一套為了改進某學校系統介面及使用性而寫的 GreaseMonkey 插件。

## 安裝

1. 依照您的瀏覽器安裝 ViolentMonkey 或 TamperMonkey
    * [Edge](https://www.microsoft.com/en-us/p/tampermonkey/9nblggh5162s)
    * [Firefox](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
    * [Chrome](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
2. [點此安裝 NPTU-Redux](https://github.com/mt-hack/nptu-redux/raw/master/nptu-redux.user.js)
3. 大功告成！享受新版平台吧！

## 功能

* 以 Google 的 [Material Design](https://material.io) 設計為基底
* 改進整體頁面 HTML
* 支援學生/教職員用戶端 (推廣教育及校友資訊尚未測試)
* 支援 i-net 報表各項匯出功能 (不必再安裝 Java 然後再去開IE啦！)

### 學生端功能

* 首頁新增小工具
    * 近學期缺席
    * 近學期成績

### 教職員端功能

* Coming soon!

## 設定

本插件的設計可讓使用者自行決定要開啟及關閉哪些功能，但目前還是得透過手動編輯程式碼的方式設定這些功能。

步驟：

1. 於 ViolentMonkey 或 TamperMonkey 中開啟並編輯「NPTU Redux」
2. 您將會看到如下的一段程式碼：

    ```js
    let options = {
        // Enables grade widget
        enableGradeOnHome: true,
        // Enables absence widget
        enableAbsenceOnHome: true,
        // Shows the old header in case of component breakage
        enableMaterialHeader: true,
        // Enables custom export options for printing
        enableCustomExport: true,
        // Enables experimental features (use at your own risk!)
        enableExperimental: false,
        // Pages whose tables need to be fixed; works like a whitelist
        tableFixApplication: ["A0432SPage", "A0433SPage"],
    };
    ```

3. 每一項 `true` 及 `false` 代表各項功能的開關設定，如將其設定為 `true` 會將該功能開啟
4. 於編輯後存檔並關閉

## 已知問題

* CSS 需 fallback 支援 (如 404 或MIME type mismatch 時應用舊版)
* 目前 Javascript 急需整理
