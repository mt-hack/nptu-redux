// ==UserScript==
// @name NPTU Redux
// @description Provides QOL improvements for the web control panel of Taiwan Pingtung University
// @license MIT
// @author MT.Hack
// @grant GM_setClipboard
// @grant GM_notification
// @require https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.8.0/clipboard-polyfill.js
// @match http://webap.nptu.edu.tw/Web/Message/default.aspx
// @match https://webap.nptu.edu.tw/Web/Message/default.aspx
// @downloadUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @updateUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// ==/UserScript==

var options = {
    disableOldHeader: true,
};

MAIN.frameElement.onload = function () {
    injectCss();
    tableFix();
    printFix();
    setupClipboard();
};

function setupClipboard() {
    let contentBody = MAIN.document.body;
    // Clipboard
    contentBody.querySelectorAll('.copyable').forEach(element => {
        element.addEventListener('click', function () {
            clipboard.writeText(this.innerText);
            GM_notification(this.innerText, "已複製至剪貼簿中！");
        });
    });
};

function injectCss() {
    let contentHead = MAIN.document.head;
    let contentBody = MAIN.document.body;
    let oldHeader = contentBody.querySelector('.TableCommonHeader').parentNode.parentNode;
    //  #region [CSS]
    let newHeaderStyle = make({
        el: "style",
        html: `
        body {
            font-family: 'Microsoft YaHei', 'Microsoft JhengHei', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        
        /* copyable */
        
        .copyable.hoverable {
            transition: text-shadow .5s;
        }
        
        .copyable.hoverable:hover {
            text-shadow: 3px 3px 1px rgba(0, 0, 0, 0.5);
            cursor: pointer;
        }
        
        /* header */
        .main.container {
            flex-direction: column;
            flex: 2.5
        }
        
        .alt.container {
            flex: 1;
        }
        
        .alt.buttons.container.right {
            justify-content: flex-end;
        }
        
        .alt.buttons.container.left {
            justify-content: flex-start;
        }
        
        #module-info {
            text-align: right;
            padding-right: .5em;
        }
        
        #user-info {
            text-align: left;
            padding-left: .5em;
        }
        
        .header-container {
            display: flex;
            background-color: #1b5e20;
            color: white;
            border-radius: 15px;
            font-size: 1.35em;
            padding: .5em;
            -webkit-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
            box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
        }
        
        .header-container .container {
            display: inline-flex;
        }
        
        .header-container .container div {
            display: inline;
            vertical-align: top;
        }
        
        .header-container .material-icons {
            text-shadow: 1px 1px 1px black;
        }
        
        /* buttons */
        
        .btn {
            font-family: 'Material Icons';
            font-size: 3em;
            cursor: pointer;
            background: none;
            border: none;
            color: white;
            padding-right: .1em;
        }
        
        .btn.hoverable {
            -webkit-transition: -webkit-box-shadow .25s;
            transition: -webkit-box-shadow .25s;
            transition: box-shadow .25s;
            transition: box-shadow .25s, -webkit-box-shadow .25s
        }
        
        .btn.hoverable:hover {
            -webkit-box-shadow: 0 8px 17px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
            box-shadow: 0 8px 17px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)
        }
        
        /* Print button */
        .print.btn {
            background: gray;
            border: 1px solid rgba(0, 0, 0, .1);
            font-size: 18pt;
            padding: 0 1.25em;
            letter-spacing: .5px;
            outline: 0;
            border-radius: 5px;
        }

        .print.container {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            justify-content: center;
        }

        .export-link,
        .export-link:hover,
        .export-link:active,
        .export-link:focus,
        .export-link:focus-within {
            text-decoration: none;
        }

        .export-section {
            padding: 1em 2em;
        }
        `
    });
    //  #endregion

    //  #region [HTML Declaration]
    let newHeaderHtml = `<div class="header-container"><div class="alt buttons container left">`;
    //    #region [Button] Home
    let oldHome = contentBody.querySelector('#CommonHeader_ibtBackHome');
    if (oldHome) {
        newHeaderHtml += `
            <input id=${oldHome.id} value="" type="image" class="btn hoverable" name=${oldHome.name} title=${oldHome.title} alt='home'">`;
    }
    //  #endregion
    newHeaderHtml += `</div><div class="main container" id="module-info">`;
    //    #region [Display] Page Name
    let moduleName = contentBody.querySelector('#CommonHeader_lblModule').innerText;
    if (moduleName) {
        newHeaderHtml += `
            <div>
                <i class="material-icons">dashboard</i>
                <div class="copyable hoverable" id="page-name">
                    ${moduleName}
                </div>
            </div>`;
    }
    //  #endregion
    //    #region [Display] Semester
    let semesterName = contentBody.querySelector('#CommonHeader_lblYSC').innerText.replace(/:|：/g, '');
    if (semesterName) {
        newHeaderHtml += `
            <div>
                <i class="material-icons">event</i>
                <div class="copyable hoverable" id="semester-name">
                    ${semesterName}
                </div>
            </div>`;
    }
    //  #endregion
    newHeaderHtml += `</div><div class="main container" id="user-info">`;
    //    #region [Display] Username
    let loginName = contentBody.querySelector('#CommonHeader_lblName').innerText;
    if (loginName) {
        newHeaderHtml += `
            <div>
                <i class="material-icons">person</i>
                <div class="copyable hoverable" id="user-name">
                    ${loginName}
                </div>
            </div>`;
    }
    //  #endregion
    //    #region [Display] Online User Count
    let onlineUsers = contentBody.querySelector('.CommomHeadstyle2 font').innerText;
    if (onlineUsers) {
        newHeaderHtml += `
            <div>
                <i class="material-icons">people</i>
                <div class="copyable hoverable" id="user-count">
                    ${onlineUsers}
                </div>
            </div>`;
    }
    //  #endregion
    newHeaderHtml += `</div><div class="alt buttons container right">`;
    //    #region [Button] Change Semester
    let oldSemSwitch = contentBody.querySelector('#CommonHeader_ibtChgSYearSeme');
    if (oldSemSwitch) {
        newHeaderHtml += `
            <input id=${oldSemSwitch.id} value="" type="image" class="btn hoverable" name=${oldSemSwitch.name} title=${oldSemSwitch.title} alt='event'>`;
    }
    //    #endregion
    //    #region [Button] Password Change
    let oldPwdBtn = contentBody.querySelector('#CommonHeader_ibtChgPwd');
    if (oldPwdBtn) {
        newHeaderHtml += `
        <input id=${oldPwdBtn.id} value="" type="image" class="waves-button btn hoverable" name=${oldPwdBtn.name} title=${oldPwdBtn.title} alt='lock'>`;
    }
    //    #endregion
    //    #region [Button] Logout
    let oldLogout = contentBody.querySelector('#CommonHeader_ibtLogOut');
    if (oldLogout) {
        newHeaderHtml += `
            <input id=${oldLogout.id} value="" type="image" class="btn hoverable" name=${oldLogout.name} title=${oldLogout.title} alt='exit_to_app' onclick="return LogOutConfirm();">`;
    }
    //  #endregion
    newHeaderHtml += `</div></div>`;
    //  #endregion
    let newHeader = make({
        el: "header",
        html: newHeaderHtml
    });
    contentHead.insertAdjacentElement('afterbegin', newHeaderStyle);
    injectStyle(contentHead, '//fonts.googleapis.com/icon?family=Material+Icons');
    oldHeader.parentNode.prepend(newHeader);
    if (options.disableOldHeader)
        oldHeader.remove();
}

let brokenTablePages = ["A0432SPage", "A0433SPage"]

// Fix A0432S broken implementation of tables
function tableFix() {
    let contentBody = MAIN.document.body;
    if (brokenTablePages.includes(contentBody.querySelector('form').name)) {
        let rails = contentBody.querySelectorAll('div[id*=Rail]');
        let bars = contentBody.querySelectorAll('div[id*=Bar]');
        rails.forEach(element => {
            element.remove();
        });
        bars.forEach(element => {
            element.remove();
        });
        let dataWrapper = contentBody.querySelector('div[id*=dgDataWrapper]');
        dataWrapper.style.width = null;
        dataWrapper.style.height = null;
        let panelHeaders = contentBody.querySelectorAll('div[id*=dgDataPanelHeader]');
        panelHeaders.forEach(element => {
            element.style.width = null;
            element.style.overflow = "auto";
        });
        let panelItems = contentBody.querySelectorAll('div[id*=dgDataPanelItem]');
        panelItems.forEach(element => {
            element.style.width = null;
            element.style.height = null;
            element.style.overflow = "auto";
        });
        let panelFreeze = contentBody.querySelectorAll('div[id*=ContentFreeze');
        panelFreeze.forEach(element => {
            element.remove();
        });
        let trs = contentBody.querySelectorAll('table[id*=dgData] tr');
        trs.forEach(tr => {
            let tds = tr.querySelectorAll('td');
            tds[5].style = "position: sticky; left: 0; background: #FEECE6; color: black;";
        });

        var oldTableHeader = contentBody.querySelector("[id$=dgDataCopy] tbody");
        oldTableHeader.remove();
        var newTableHeader = document.createElement("thead");
        newTableHeader.innerHTML = oldTableHeader.innerHTML;
        var tableContent = contentBody.querySelector("[id$=dgData]");
        tableContent.prepend(newTableHeader);
        // tableContent.parentNode.style.width = "40%";
        tableContent.parentNode.parentNode.style.background = null;
    }
};

// Add export options for spreadsheet printing
function printFix() {
    let contentBody = MAIN.document.body;
    let printButtons = contentBody.querySelectorAll("form a[id*='Print']");
    if (printButtons !== null && printButtons.length > 0) {
        printButtons.forEach(printButton => {
            // create outer div for export options
            let exportMenuDiv = document.createElement("div");
            exportMenuDiv.className = "export-section";

            // create export label
            let exportLabel = document.createElement("label");
            exportLabel.for = "export-menu";
            exportLabel.innerText = "匯出選項："

            // prepare export menu
            let exportMenu = document.createElement("select");
            exportMenu.className = "export-menu";
            let exportPdf = document.createElement("option");
            exportPdf.value = "pdf";
            exportPdf.innerText = "PDF";
            let exportExcel = document.createElement("option");
            exportExcel.value = "xls";
            exportExcel.innerText = "Excel";
            let exportRtf = document.createElement("option");
            exportRtf.value = "rtf";
            exportRtf.innerText = "RTF";
            exportMenu.appendChild(exportPdf);
            exportMenu.appendChild(exportExcel);
            exportMenu.appendChild(exportRtf);

            // change print button
            let exportButton = document.createElement('div');
            exportButton.className = 'print btn material-icon hoverable';
            exportButton.innerText = 'print 點此下載報表';
            let exportLink = document.createElement('a');
            exportLink.target = "_blank";
            exportLink.href = printButton.href;
            exportLink.title = printButton.title;
            exportLink.appendChild(exportButton);

            // hook printing button update
            exportMenu.onchange = updatePrint;

            function updatePrint() {
                let url = new URL(exportLink.href);
                url.searchParams.set("init", exportMenu.value);
                exportLink.href = url;
            };

            exportMenuDiv.appendChild(exportLabel);
            exportMenuDiv.appendChild(exportMenu);

            let exportDiv = document.createElement('div');
            exportDiv.className = 'print container';
            exportDiv.appendChild(exportMenuDiv);
            exportDiv.appendChild(exportLink);
            printButton.parentNode.parentNode.appendChild(exportDiv);
            printButton.parentNode.remove();
            // update button on load
            updatePrint();
        });
    }
};

/* Helper Method */

// Copied from GitHub Dark Script
// https://github.com/StylishThemes/GitHub-Dark/blob/master/LICENSE
function make(obj) {
    let key,
        el = document.createElement(obj.el);
    if (obj.class) {
        el.className = obj.class;
    }
    if (obj.html) {
        el.innerHTML = obj.html;
    }
    if (obj.attr) {
        for (key in obj.attr) {
            if (obj.attr.hasOwnProperty(key)) {
                el.setAttribute(key, obj.attr[key]);
            }
        }
    }
    if (obj.appendTo) {
        $(obj.appendTo).appendChild(el);
    }
    return el;
}

/* Helper Scripts */


function injectStyle(head, style) {
    let css = document.createElement('link');
    css.href = style;
    css.rel = "stylesheet";
    head.appendChild(css);
    log(`Injected '${style}'.`);
}

function injectScript(head, script) {
    let js = document.createElement('script');
    js.src = script;
    js.type = "text/javascript";
    head.appendChild(js);
    log(`Injected '${script}'.`);
}

function log(msg) {
    console.log(`[NPTU Redux] ${msg}`);
}