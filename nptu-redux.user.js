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
// @version 1.0.2
// ==/UserScript==

var options = {
    // Enables grade viewing on homepage
    addGradeOnHome: true,
    // Shows the old header in case of component breakage
    disableOldHeader: true,
    // Pages whose tables need to be fixed; works like a whitelist
    tableFixApplication: ["A0432S", "A0433S"],
};

MAIN.frameElement.onload = function () {
    let currentPage = getMainForm();
    injectCss();
    if (/Main.aspx/g.test(currentPage.action)) {
        decorateHomePage();
    }
    if (options.tableFixApplication.includes(currentPage.name + 'Page')) {
        tableFix();
    }
    printFix();
    setupClipboard();
};

function injectCss() {
    let contentHead = MAIN.document.head;
    let contentBody = MAIN.document.body;
    let oldHeader = contentBody.querySelector('.TableCommonHeader').parentNode.parentNode;
    //  #region [HTML Declaration]
    let newHeaderHtml = `<div class="top header container"><div class="alt buttons container left">`;
    //    #region [Button] Home
    let oldHome = contentBody.querySelector('#CommonHeader_ibtBackHome');
    if (oldHome) {
        newHeaderHtml += `
            <input id=${oldHome.id} value="" type="image" class="btn hoverable" name=${oldHome.name} title=${oldHome.title} alt='home'">`;
    }
    //  #endregion
    newHeaderHtml += `</div><div class="sub container" id="module-info">`;
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
    newHeaderHtml += `</div><div class="sub container" id="user-info">`;
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
    injectStyle(contentHead, 'https://fonts.googleapis.com/icon?family=Material+Icons');
    injectStyle(contentHead, 'https://cdn.jsdelivr.net/gh/mt-hack/nptu-redux/nptu-redux.css');
    getMainForm().prepend(newHeader);
    if (options.disableOldHeader)
        oldHeader.remove();
}


function decorateHomePage() {
    let contentBody = MAIN.document.body;
    // #region Page Cleanup
    let mainBodies = contentBody.querySelectorAll('.MainBody');
    let mainForm = getMainForm();
    let mainDiv = make({
        el: 'div',
        class: 'main container',
    });
    mainBodies.forEach(element => {
        element.remove();
        if (element.childElementCount > 0) {
            let elementDiv = make({
                el: 'div',
                class: 'menu container',
                html: element.innerHTML
            });
            mainDiv.appendChild(elementDiv);
        }
    });
    mainForm.appendChild(mainDiv);
    contentBody.querySelector('.TableDefault').remove();
    // #endregion

    let infoDiv = contentBody.querySelector('.main .menu');
    infoDiv.className += ' information';

    let oldAnnounceHeader = contentBody.querySelector("img[src*='Images/HotNews/Hotnew.gif']");
    if (oldAnnounceHeader) {
        let newAnnounceHeader = createHeader('系統公告 Announcements', 'speaker_notes');
        oldAnnounceHeader.parentNode.innerHTML = newAnnounceHeader.outerHTML;
    }

    // Additional check for the semester change button
    // If it doesn't exist, the user is likely a student
    if (options.addGradeOnHome && !contentBody.querySelector('#CommonHeader_ibtChgSYearSeme')) {
        let gradesHeader = createHeader('近學期成績 Recent Semester Grade', 'assessment');
        infoDiv.appendChild(gradesHeader);
        let gradesFrame = make({
            el: 'iframe',
            class: 'inline-frame',
            attr: {
                id: 'grades-frame',
                src: '../A08/A0809QPage.aspx'
            },
        });
        infoDiv.appendChild(gradesFrame);
        gradesFrame.addEventListener('load', function () {
            let frameBody = gradesFrame.contentDocument.body;
            let gradesTable = frameBody.querySelector('#A0809Q_dgData');
            gradesTable.style.boxShadow = '0 4px 5px 0 rgba(0,0,0,0.14),0 1px 10px 0 rgba(0,0,0,0.12),0 2px 4px -1px rgba(0,0,0,0.3)';
            let gradesInfo = frameBody.querySelector('#A0809Q_lblSCO_AVG');
            frameBody.querySelector('form').remove();
            let gradesDiv = make({
                el: 'div',
                attr: {
                    style: 'display: flex; flex-direction: column; align-items: center;'
                }
            });
            gradesDiv.appendChild(gradesInfo);
            gradesDiv.appendChild(gradesTable);
            frameBody.appendChild(gradesDiv);
            gradesFrame.height = gradesFrame.contentDocument.body.scrollHeight;
        });
    }
}
// Fix A0432S broken implementation of tables
function tableFix() {
    let contentBody = MAIN.document.body;
    let rails = contentBody.querySelectorAll('div[id*=Rail]');
    let bars = contentBody.querySelectorAll('div[id*=Bar]');
    rails.forEach(element => {
        element.remove();
    });
    bars.forEach(element => {
        element.remove();
    });
    let dataWrapper = contentBody.querySelector('div[id*=dgDataWrapper]');
    if (dataWrapper) {
        dataWrapper.style.width = null;
        dataWrapper.style.height = null;
    }
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
        if (trs.length >= 6) {
            tds[5].style = "position: sticky; left: 0; background: #FEECE6; color: black;";
        }
    });

    var oldTableHeader = contentBody.querySelector("[id$=dgDataCopy] tbody");
    if (oldTableHeader) {
        oldTableHeader.remove();
        var newTableHeader = document.createElement("thead");
        newTableHeader.innerHTML = oldTableHeader.innerHTML;
        var tableContent = contentBody.querySelector("[id$=dgData]");
        tableContent.prepend(newTableHeader);
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

function createHeader(text, icon) {
    let htmlString = '';
    if (icon) {
        htmlString += `<i class="material-icons">${icon}</i>`;
    }
    htmlString += `<span class='title-with-icon left'>${text}</span>`
    return make({
        el: 'div',
        class: 'header container',
        html: htmlString
    });
}


function getMainForm() {
    return MAIN.document.body.querySelector('body>form');
}

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