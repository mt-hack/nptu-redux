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
// @version 1.0.13
// ==/UserScript==

let customCss = `https://cdn.jsdelivr.net/gh/mt-hack/nptu-redux@1/nptu-redux.min.css`;
let options = {
    // Enables grade viewing on homepage
    enableGradeOnHome: true,
    enableAbsenceOnHome: true,
    // Shows the old header in case of component breakage
    enableMaterialHeader: true,
    // Pages whose tables need to be fixed; works like a whitelist
    tableFixApplication: ["A0432SPage", "A0433SPage"],
};

let emptyImage = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';

let mainElement = document.querySelector('frame[name=MAIN]');
if (!mainElement) {
    log('Main element cannot be found; exiting.');
    return;
} else {
    var mainWindow = mainElement.contentWindow;
}

mainWindow.frameElement.onload = function () {
    let currentPage = getMainForm();
    injectStyle(mainWindow.document.head, 'https://fonts.googleapis.com/icon?family=Material+Icons');
    injectStyle(mainWindow.document.head, customCss);
    if (options.enableMaterialHeader) {
        injectHeader();
    }
    pageCleanup();
    if (/Main.aspx/g.test(currentPage.action)) {
        // Check for the semester change button; if one doesn't exist, likely student
        if (!currentPage.querySelector('#CommonHeader_ibtChgSYearSeme') &&
            !currentPage.querySelector('input[src*=GST_M]')) {
            if (options.enableGradeOnHome) {
                injectGradesTable();
            }
            if (options.enableAbsenceOnHome) {
                injectAbsenceTable();
            }
        }
    }
    if (options.tableFixApplication.includes(currentPage.name)) {
        tableFix();
    }
    printFix();
    setupClipboard(mainWindow.document.body);
};


function injectHeader() {
    let contentBody = mainWindow.document.body;
    let oldHeader = contentBody.querySelector('.TableCommonHeader').parentNode.parentNode;
    //  #region [HTML Declaration]
    let newHeaderHtml = `<div class="top header container"><div class="alt buttons container left">`;
    //    #region [Button] Home
    let oldHome = contentBody.querySelector('#CommonHeader_ibtBackHome');
    if (oldHome) {
        newHeaderHtml += `
            <label for=${oldHome.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>home</label>
            <input id=${oldHome.id} src=${emptyImage} style='display: none;' value='' type="image" name=${oldHome.name} title=${oldHome.title}>`;
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
            <input id=${oldSemSwitch.id} src=${emptyImage} style='display: none;' value='' type="image" name=${oldSemSwitch.name} title=${oldSemSwitch.title}>`;
    }
    //    #endregion
    //    #region [Button] Password Change
    let oldPwdBtn = contentBody.querySelector('#CommonHeader_ibtChgPwd');
    if (oldPwdBtn) {
        newHeaderHtml += `
            <label for=${oldPwdBtn.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>lock</label>
            <input id=${oldPwdBtn.id} src=${emptyImage} style='display: none;' value='' type="image" name=${oldPwdBtn.name} title=${oldPwdBtn.title}>`;
    }
    //    #endregion
    //    #region [Button] Logout
    let oldLogout = contentBody.querySelector('#CommonHeader_ibtLogOut');
    if (oldLogout) {
        newHeaderHtml += `
            <label for=${oldLogout.id} class='btn hoverable' onclick='this.nextElementSibling.click();'>exit_to_app</label>
            <input id=${oldLogout.id} src=${emptyImage} style='display: none;' value='' type="image" name=${oldLogout.name} title=${oldLogout.title}>`;
    }
    //  #endregion
    newHeaderHtml += `</div></div>`;
    //  #endregion
    let newHeader = make({
        el: "header",
        html: newHeaderHtml
    });
    getMainForm().prepend(newHeader);
    oldHeader.remove();
}

function pageCleanup() {
    let contentBody = mainWindow.document.body;
    // #region Page Cleanup
    let mainBodies = contentBody.querySelectorAll('.MainBody');
    let mainForm = getMainForm();
    let mainDiv = make({
        el: 'div',
        class: 'main container',
    });
    let menuElements = [];
    let elementDiv = null;
    mainBodies.forEach(element => {
        element.remove();
        if (element.childElementCount > 0 && !isNullOrWhitespace(element.innerText)) {
            // identifier for menu tabs
            if (!element.querySelector('td.UnUse')) {
                elementDiv = make({
                    el: 'div',
                    class: 'menu container',
                    html: element.innerHTML
                });
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
    mainForm.appendChild(mainDiv);
    contentBody.querySelector('.TableDefault').remove();
    // #endregion

    let infoDiv = contentBody.querySelector('.main .menu');
    if (infoDiv) {
        infoDiv.className += ' information';
    }

    let oldAnnounceHeader = contentBody.querySelector("img[src*='Images/HotNews/Hotnew.gif']");
    if (oldAnnounceHeader) {
        let newAnnounceHeader = createHeader('系統公告 Announcements', 'speaker_notes');
        oldAnnounceHeader.parentNode.innerHTML = newAnnounceHeader.outerHTML;
    }
}

function injectAbsenceTable() {
    let contentBody = mainWindow.document.body;
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
        frameBody.querySelector('form').remove();
        enableCellWrap(absenceTable);
        absenceDiv.appendChild(absenceTable);
        frameBody.appendChild(absenceDiv);
        absenceFrame.height = absenceFrame.contentDocument.body.scrollHeight + 20;
    });
}

function injectGradesTable() {
    let contentBody = mainWindow.document.body;
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
        frameBody.querySelector('form').remove();
        enableCellWrap(gradesTable);
        gradesDiv.appendChild(gradesInfo);
        gradesDiv.appendChild(gradesTable);
        frameBody.appendChild(gradesDiv);
        let subjectNames = gradesTable.querySelectorAll('tr:not(:first-child)  td:nth-of-type(3)');
        if (subjectNames) {
            subjectNames.forEach(subjectName => {
                subjectName.className += ` copyable`;
            });
            setupClipboard(frameBody);
        }
        gradesFrame.height = gradesFrame.contentDocument.body.scrollHeight + 20;
    });
}

// Fix A0432S broken implementation of tables
function tableFix() {
    let contentBody = mainWindow.document.body;
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
function printFix() {
    let contentBody = mainWindow.document.body;
    let printButtons = contentBody.querySelectorAll("form a[id*='Print']");
    if (printButtons !== null && printButtons.length > 0) {
        printButtons.forEach(printButton => {
            // create outer div for export options
            let exportMenuDiv = document.createElement("div");
            exportMenuDiv.className = "export-section";

            // create export label
            let exportLabel = document.createElement("label");
            exportLabel.for = "export-menu";
            exportLabel.appendChild(document.createTextNode('匯出選項：'));

            // prepare export menu
            let exportMenu = document.createElement("select");
            exportMenu.className = "export-menu";
            let exportPdf = document.createElement("option");
            exportPdf.value = "pdf";
            exportPdf.appendChild(document.createTextNode('PDF'));
            let exportExcel = document.createElement("option");
            exportExcel.value = "xls";
            exportExcel.appendChild(document.createTextNode('Excel'));
            let exportRtf = document.createElement("option");
            exportRtf.value = "rtf";
            exportRtf.appendChild(document.createTextNode('RTF'));
            exportMenu.appendChild(exportPdf);
            exportMenu.appendChild(exportExcel);
            exportMenu.appendChild(exportRtf);

            // change print button
            let exportButton = document.createElement('div');
            exportButton.className = 'print btn material-icon hoverable';
            exportButton.appendChild(document.createTextNode('print 點此下載報表'));
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
                exportLink.href = url.href;
            }

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

function getMainForm() {
    return mainWindow.document.body.querySelector('body>form');
}

// not using GM_addstyle since we need to access various frame heads
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