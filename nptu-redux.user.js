// ==UserScript==
// @name NPTU Redux
// @description Provides QOL improvements for the web control panel of Taiwan Pingtung University
// @license MIT
// @author MT.Hack
// @grant GM_setClipboard
// @grant GM_download
// @grant GM_notification
// @require https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.8.0/clipboard-polyfill.js
// @require https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js
// @require https://code.getmdl.io/1.3.0/material.min.js
// @match http://webap.nptu.edu.tw/Web/Message/default.aspx
// @match https://webap.nptu.edu.tw/Web/Message/default.aspx
// @downloadUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @updateUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @version 1.0.14
// ==/UserScript==

/* 
=========================================================
User configurable options 
=========================================================
*/

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

/* 
=========================================================
LIVE CODE
DO NOT TOUCH THE BELOW UNLESS YOU KNOW WHAT YOU ARE DOING
=========================================================
*/

let emptyImage = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
let customCss = 'https://cdn.jsdelivr.net/gh/mt-hack/nptu-redux@1/nptu-redux.min.css';
let raisedButtonClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored';
let mainElement = document.querySelector('frame[name=MAIN]');
if (!mainElement) {
    log('Main element cannot be found.');
} else {
    var mainWindow = mainElement.contentWindow;
}

mainWindow.frameElement.onload = function () {
    let unsafeFrame = unsafeWindow.document.querySelector('frame[name=MAIN]');
    if (unsafeFrame){
        let webFormMethod = unsafeFrame.contentWindow.WebForm_OnSubmit;
        if (webFormMethod){
            unsafeFrame.contentWindow.WebForm_OnSubmit = function(){
                toggleOverlay(mainWindow.document);
            }
        }
    }
    
    let contentBody = mainWindow.document.body;
    let currentPage = contentBody.querySelector('body>form');
    injectStyle(mainWindow.document.head, 'https://fonts.googleapis.com/icon?family=Material+Icons');
    injectStyle(mainWindow.document.head, 'https://code.getmdl.io/1.3.0/material.teal-indigo.min.css');
    injectStyle(mainWindow.document.head, customCss);
    if (options.enableMaterialHeader) {
        injectHeader(contentBody);
    }
    pageCleanup(contentBody);
    if (/Main.aspx/g.test(currentPage.action)) {
        // Check for the semester change button; if one doesn't exist, likely student
        if (!currentPage.querySelector('#CommonHeader_ibtChgSYearSeme') &&
            !currentPage.querySelector('input[src*=GST_M]')) {
            if (options.enableGradeOnHome) {
                injectGradesTable(contentBody);
            }
            if (options.enableAbsenceOnHome) {
                injectAbsenceTable(contentBody);
            }
        }
    }
    if (options.enableCustomExport) {
        printFix(contentBody);
    }
    if (options.tableFixApplication.includes(currentPage.name)) {
        tableFix(contentBody);
    }
    // Experimental features
    if (options.enableExperimental){
        // Table image export feature; currently buggy
        let tableData = contentBody.querySelectorAll('table[id*=dgData]');
        for (let i = 0, ti = tableData.length; i < ti; i++) {
            if (tableData[i].innerText.includes('科目'))
                injectTableDownload(tableData[i]);
        }
    }
    organizeCourseList(contentBody);
    setupClipboard(contentBody);
};

function injectHeader(contentBody) {
    let oldHeader = contentBody.querySelector('.TableCommonHeader').parentNode.parentNode;
    //  #region [HTML Declaration]
    let newHeaderHtml = `<div class="top header container"><div class="alt buttons container left">`;
    //    #region [Button] Home
    let oldHome = contentBody.querySelector('#CommonHeader_ibtBackHome');
    if (oldHome) {
        newHeaderHtml += `
            <label for=${oldHome.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>home</label>
            <input id=${oldHome.id} src=${emptyImage} style='display: none;' value='' type="image" name=${oldHome.name} alt=${oldHome.alt} title=${oldHome.title}>`;
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
    let semesterName = contentBody.querySelector('#CommonHeader_lblYSC').innerText.replace(/[:：]/g, '');
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
            <label for=${oldSemSwitch.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>event</label>
            <input id=${oldSemSwitch.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldSemSwitch.name} name=${oldSemSwitch.name} title=${oldSemSwitch.title}>`;
    }
    //    #endregion
    //    #region [Button] Password Change
    let oldPwdBtn = contentBody.querySelector('#CommonHeader_ibtChgPwd');
    if (oldPwdBtn) {
        newHeaderHtml += `
            <label for=${oldPwdBtn.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>lock</label>
            <input id=${oldPwdBtn.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldPwdBtn.name} name=${oldPwdBtn.name} title=${oldPwdBtn.title}>`;
    }
    //    #endregion
    //    #region [Button] Logout
    let oldLogout = contentBody.querySelector('#CommonHeader_ibtLogOut');
    if (oldLogout) {
        newHeaderHtml += `
            <label for=${oldLogout.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>exit_to_app</label>
            <input id=${oldLogout.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldLogout.name} name=${oldLogout.name} title=${oldLogout.title}>`;
    }
    //  #endregion
    newHeaderHtml += `</div></div>`;
    //  #endregion
    let newHeader = make({
        el: "header",
        html: newHeaderHtml
    });
    mainWindow.document.body.querySelector('body>form').prepend(newHeader);
    oldHeader.remove();
}

// Replaces each MainBody (td) with a div
function pageCleanup(contentBody) {
    // #region Page Cleanup
    let mainTable = contentBody.querySelector('.TableDefault');
    if (!mainTable) {
        log('TableDefault does not exist, skipping page cleanup.');
        return;
    }
    let mainBodies = contentBody.querySelectorAll('.MainBody');
    let mainForm = contentBody.querySelector('body>form');
    let mainDiv = make({
        el: 'div',
        class: 'main container',
    });
    let menuElements = [];
    let elementDiv = null;
    mainBodies.forEach(element => {
        if (!isSafeToDelete(element)) {
            // identifier for menu tabs
            if (!element.querySelector('td.UnUse')) {
                elementDiv = make({
                    el: 'div',
                    class: 'menu container',
                    html: element.innerHTML
                });
                // Extreme edge case; thank you whoever designed this system, very cool
                let printButtons = contentBody.querySelectorAll('a[id*=hylPrint]');
                for (let i = 0; i < printButtons.length; i++) {
                    elementDiv.appendChild(printButtons[i]);
                }
                mainDiv.appendChild(elementDiv);
            } else {
                menuElements.push(element.innerHTML);
            }
        }
    });
    if (elementDiv) {
        menuElements.forEach(element => {
            elementDiv.insertAdjacentHTML('afterbegin', element);
        });
    }
    mainForm.replaceChild(mainDiv, mainTable);
    // #endregion

    let infoDiv = contentBody.querySelector('.main .menu');
    if (infoDiv) {
        infoDiv.classList.add('information');
    }

    let oldAnnounceHeader = contentBody.querySelector("img[src*='Images/HotNews/Hotnew.gif']");
    if (oldAnnounceHeader) {
        let newAnnounceHeader = createHeader('系統公告 Announcements', 'speaker_notes');
        oldAnnounceHeader.parentNode.replaceChild(newAnnounceHeader, oldAnnounceHeader);
    }

    let oldHelpPanel = contentBody.querySelector('#TableHelp');
    if (oldHelpPanel) {
        let helpText = oldHelpPanel.innerText.trim();
        let newHelpPanel = make({
            el: 'div',
            class: 'help container'
        });
        if (helpText.length === 0) {
            helpText = '此頁並無提供說明。No description provided.'
        }
        let helpHeader = createHeader('說明 Information', 'help');
        let helpTextContainer = make({
            el: 'div',
            class: 'text container',
        });
        helpTextContainer.appendChild(document.createTextNode(helpText));
        newHelpPanel.appendChild(helpHeader);
        newHelpPanel.appendChild(helpTextContainer);
        oldHelpPanel.parentNode.replaceChild(newHelpPanel, oldHelpPanel);
    }
}

function injectAbsenceTable(contentBody) {
    // we should probably create one on the fly instead?
    let infoDiv = contentBody.querySelector('.information');
    if (!infoDiv) {
        log("Info div not found; this shouldn't happen, hopefully.");
        return;
    }
    let absenceHeader = createHeader('曠課紀錄 Recent Absences', 'schedule');
    infoDiv.appendChild(absenceHeader);
    let absenceFrame = make({
        el: 'iframe',
        class: 'inline-frame',
        attr: {
            id: 'absence-frame',
            src: '../B01/B0105SPage.aspx'
        },
    });
    infoDiv.appendChild(absenceFrame);
    absenceFrame.addEventListener('load', function () {
        // inject css 
        injectStyle(absenceFrame.contentDocument.head, customCss);
        // remove irrelevant elements
        let frameBody = absenceFrame.contentDocument.body;
        let absenceTable = frameBody.querySelector('table[id*=dgData]');
        let absenceDiv = make({
            el: 'div',
            attr: {
                style: 'display: flex; flex-direction: column; align-items: center;'
            }
        });
        enableCellWrap(absenceTable);
        absenceDiv.appendChild(absenceTable);
        frameBody.replaceChild(absenceDiv, frameBody.querySelector('form'));
        absenceFrame.height = absenceFrame.contentDocument.body.scrollHeight + 20;
    });
}

function injectGradesTable(contentBody) {
    // we should probably create one on the fly instead?
    let infoDiv = contentBody.querySelector('.information');
    if (!infoDiv) {
        log("Info div not found; this shouldn't happen, hopefully.");
        return;
    }
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
        // inject css 
        injectStyle(gradesFrame.contentDocument.head, customCss);
        // remove irrelevant elements
        let frameBody = gradesFrame.contentDocument.body;
        let gradesTable = frameBody.querySelector('table[id*=dgData]');
        let gradesInfo = frameBody.querySelector('#A0809Q_lblSCO_AVG');
        let gradesDiv = make({
            el: 'div',
            attr: {
                style: 'display: flex; flex-direction: column; align-items: center;'
            }
        });
        enableCellWrap(gradesTable);
        gradesDiv.appendChild(gradesInfo);
        gradesDiv.appendChild(gradesTable);
        frameBody.replaceChild(gradesDiv, frameBody.querySelector('form'));
        let subjectNames = gradesTable.querySelectorAll('tr:not(:first-child)  td:nth-of-type(3)');
        if (subjectNames) {
            subjectNames.forEach(subjectName => {
                subjectName.classList.add('copyable');
            });
            setupClipboard(frameBody);
        }
        gradesFrame.height = gradesFrame.contentDocument.body.scrollHeight + 20;
    });
}

// Fix A0432S broken implementation of tables
function tableFix(contentBody) {
    let dataWrapper = contentBody.querySelector('div[id*=dgDataWrapper]');
    if (!dataWrapper) {
        log('Valid table not found, skipping...');
        return;
    } else {
        dataWrapper.style.width = null;
        dataWrapper.style.height = null;
    }
    let rails = contentBody.querySelectorAll('div[id*=Rail]');
    let bars = contentBody.querySelectorAll('div[id*=Bar]');
    rails.forEach(element => {
        element.remove();
    });
    bars.forEach(element => {
        element.remove();
    });
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
        // definitely replace this with css instead of this nonsense
        let tds = tr.querySelectorAll('td');
        if (trs.length >= 6) {
            tds[5].style = 'position: sticky; left: 0; background: #FEECE6; color: black;';
        }
    });

    let oldTableHeader = contentBody.querySelector("[id$=dgDataCopy] tbody");
    if (oldTableHeader) {
        oldTableHeader.remove();
        let newTableHeader = document.createElement("thead");
        newTableHeader.innerHTML = oldTableHeader.innerHTML;
        let tableContent = contentBody.querySelector("[id$=dgData]");
        tableContent.prepend(newTableHeader);
        tableContent.parentNode.parentNode.style.background = null;
    }

}

// Add export options for spreadsheet printing
function printFix(contentBody) {
    let printButtons = contentBody.querySelectorAll("form a[id*='Print']");
    if (printButtons.length > 0) {
        printButtons.forEach(printButton => {
            // create outer div for export options
            let exportMenuDiv = document.createElement("div");
            exportMenuDiv.className = "export-section";

            // create export label
            let exportLabel = document.createElement("label");
            exportLabel.appendChild(document.createTextNode('匯出選項：'));

            // prepare export menu
            let exportMenu = make({
                el: 'select',
                class: 'export-menu',
                html: 
                `
                    <option value="pdf">PDF (Adobe PDF)</option>
                    <option value="xls">XLS (97-2003 Excel 表格)</option>
                    <option value="ods">ODS (OpenDocument 表格)</option>
                    <option value="rtf">RTF (富文字)</option>
                    <option value="txt">TXT (純文字)</option>
                `
            });

            // change print button
            let exportLinkText = document.createElement('i');
            exportLinkText.className = 'material-icons';
            exportLinkText.appendChild(document.createTextNode('print 點此下載報表'));
            let exportLink = make({
                el: 'a',
                class: raisedButtonClassnames,
                attr:{
                    target: '_blank',
                    href: printButton.href,
                    title: printButton.title,
                    style: 'display: flex; align-items: center; text-decoration: none;'
                }
            });
            exportLink.appendChild(exportLinkText);
            componentHandler.upgradeElement(exportLink);

            // hook printing button update
            exportMenu.onchange = updatePrint;

            function updatePrint() {
                let url = new URL(exportLink.href);
                url.searchParams.set("init", exportMenu.value);
                exportLink.href = url.href;
            }

            exportMenuDiv.appendChild(exportLabel);
            exportMenuDiv.appendChild(exportMenu);

            let exportDiv = document.createElement('div');
            exportDiv.className = 'print container';
            exportDiv.appendChild(exportMenuDiv);
            exportDiv.appendChild(exportLink);
            printButton.parentNode.replaceChild(exportDiv, printButton);
            // update button on load
            updatePrint();
        });
    }
}

function organizeCourseList(contentBody){
    let openIdLists = contentBody.querySelectorAll('select[name*=ddlOPEN_ID]');
    openIdLists.forEach(openIdList => {
        let incompleteGroup = make({
            el: 'optgroup',
            attr: {
                label: '尚未排課'
            }
        });
        let completeGroup = make({
            el: 'optgroup',
            attr: {
                label: '已排課'
            }
        });
        let idListOptions = openIdList.querySelectorAll('option');
        idListOptions.forEach(option => {
           if (/\d\/\d/g.test(option.innerText)) {
               completeGroup.appendChild(option);
           }else{
               incompleteGroup.appendChild(option);
           };
        });
        openIdList.appendChild(incompleteGroup);
        openIdList.appendChild(completeGroup);
    });
}

function injectTableDownload(table) {
    let newTableContainer = make({
        el: 'div',
        class: 'tbl container',
        html: table.outerHTML,
    });
    let downloadBtn = document.createElement('a');
    downloadBtn.className = raisedButtonClassnames;
    downloadBtn.classList.add('tbl-btn');
    downloadBtn.href = '#';
    componentHandler.upgradeElement(downloadBtn);
    let downloadTxt = make({
        el: 'i',
        class: 'material-icons'
    });
    downloadTxt.appendChild(document.createTextNode('存成圖檔'));
    downloadBtn.appendChild(downloadTxt);
    newTableContainer.prepend(downloadBtn);
    table.parentNode.replaceChild(newTableContainer, table);
    // define table again
    table = newTableContainer.querySelector('table');
    downloadBtn.addEventListener('click', function () {
        toggleOverlay(table.getRootNode());
        domtoimage.toPng(table).then(function (url) {
            GM_download(url, 'image.png');
            toggleOverlay(table.getRootNode());
        });
    });
}

function setupClipboard(contentBody) {
    // Clipboard
    contentBody.querySelectorAll('.copyable').forEach(element => {
        element.addEventListener('click', function () {
            clipboard.writeText(this.innerText);
            GM_notification(this.innerText, "已複製至剪貼簿中！");
        });
    });
}

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

function toggleOverlay(document) {
    let overlay = getOrCreateLoadingOverlay(document);
    if (overlay.style.display === 'none'){
        overlay.style.opacity = 0.75;
        overlay.style.display = 'flex';
    }else{
        overlay.style.opacity = 0;
        overlay.style.display = 'none';
    }
}

function getOrCreateLoadingOverlay(document) {
    let overlay = document.querySelector('.redux.overlay');
    if (!overlay) {
        overlay = make({
            el: 'div',
            class: 'redux overlay',
            attr: {
                style: 'background: black;height: 100%;width: 100%;position: absolute;top: 0;left: 0;opacity: 0;display: none;justify-content: center;align-items: center; transition: opacity 0.5s; flex-direction: column;'
            }
        });
        let spinner = make({
            el: 'div',
            class: 'mdl-spinner mdl-js-spinner is-active',
            attr: {
                style: 'width: 12em; height: 12em;'
            }
        });
        let loadTxt = make({
            el: 'div',
            class: 'white text',
            attr:{
                style: 'color: white; padding: 1em 0; font-size: 24pt;'
            }
        });
        loadTxt.appendChild(document.createTextNode('載入中...'));
        componentHandler.upgradeElement(spinner);
        overlay.appendChild(spinner);
        overlay.appendChild(loadTxt);
        document.body.prepend(overlay);
    }
    return overlay;
}

function isNullOrWhitespace(input) {
    return !input || !input.trim();
}

function createHeader(text, icon) {
    let htmlString = '';
    if (icon) {
        htmlString += `<i class="material-icons">${icon}</i>`;
    }
    htmlString += `<span class='title-with-icon left'>${text}</span>`;
    return make({
        el: 'div',
        class: 'header container',
        html: htmlString
    });
}

function enableCellWrap(content) {
    let wrapCells = content.querySelectorAll('td');
    if (wrapCells) {
        wrapCells.forEach(element => {
            element.noWrap = false;
        });
    }
}

function isSafeToDelete(element) {
    if (!isNullOrWhitespace(element.innerText)) {
        return false;
    }
    if (element.querySelector('a, img, button, input')) {
        return false;
    }
    return true;
}

// not using GM_addstyle since we need to access various frame heads
function injectStyle(head, style) {
    let css = document.createElement('link');
    css.href = style;
    css.rel = "stylesheet";
    head.appendChild(css);
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