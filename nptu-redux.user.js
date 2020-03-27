// ==UserScript==
// @name NPTU Redux
// @description Provides QOL improvements for the web control panel of Taiwan Pingtung University
// @license MIT
// @author MT.Hack
// @grant GM_setClipboard
// @grant GM_download
// @grant GM_notification
// @inject-into auto
// @require https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.8.0/clipboard-polyfill.js
// @require https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js
// @require https://code.getmdl.io/1.3.0/material.min.js
// @match *://webap*.nptu.edu.tw/*
// @downloadUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @updateUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @version 1.1.8
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
    // Enables max student number autofill based on classroom selection
    enableClassroomAutofillOnSelect: true,
    // Enables classroom shortcut in selection
    enableClassroomShortcut: true,
    enableInstructorShortcut: true,
    enableShortcutAutoSubmit: true,
    // Enables experimental features (use at your own risk!)
    enableExperimental: true,
    // Pages whose tables need to be fixed; works like a whitelist
    tableFixApplication: ["A0432SPage", "A0433SPage"],
    locationSelectionPage: ["A0413A02Page"],
    insturctorShortcutPage: ["A0413S1Page"],
    tableExportWhitelist: ["A0515S1_dgData", "A0515S_dgData", "A0809Q_dgData", "A0702S1_dgData", "B0105S_dgData", "B0208S_dgData"]
};

let subjectGroups = {
    ENG1001: 30,
    ENG1003: 60,
    ENG1004: 60,
    ENG2001: 30,
    ENG2002: 30,
    ENG2003: 60,
    ENG2005: 60,
    ENG2027: 30,
    ENG3001: 30,
    ENG3005: 60,
    ENG3032: 30,
    ENG4001: 30,
    ENG4002: 60,
    ENG2008: 49,
    ENG2028: 30,
    ENG2031: 60,
    ENG2032: 49,
    ENG2033: 49,
    ENG3004: 49,
    ENG3009: 60,
    ENG3039: 60,
    ENG4008: 60,
    ENG4014: 49,
    ENG4036: 49,
    ENG4037: 30,
    ENG4041: 30,
}

let locationShortcuts = {
    人文館103: 'G103',
    人文館104: 'G104',
    人文館二討: 'G212',
    五育樓5F視聽: 'I500'
}
let instructorShortcuts = {
    金大衛: '200010027',
    余慧珠: '200010033',
    項偉恩: '200009296',
    梁愷: '200008819',
    梁中行: '200009049',
    王彩姿: '200008861',
    楊昕昕: '200008862',
    李惠敏: '200008812',
    楊琇琇: '200008724',
    張理宏: '200008741'
}

/* 
=========================================================
LIVE CODE
DO NOT TOUCH THE BELOW UNLESS YOU KNOW WHAT YOU ARE DOING
=========================================================
*/

/*
===================
Image Fix Injection
===================
*/

let images = document.querySelectorAll('*[src*="_EN"]')
images.forEach(img => {
    img.addEventListener('error', function () {
        let englishSuffixRegex = new RegExp(/_en/gi);
        this.src = this.src.replace(englishSuffixRegex, '');
    })
})

/*
====================
Homepage Injection
====================
*/

if (window.location.href.match(/Web\/Secure\//g)) {
    let mainTable = document.querySelector('table[id=TableMain]')
    if (mainTable) {
        mainTable.querySelectorAll('table[id*=TableMain]').forEach(t => {
            t.style.border = '2px solid #1ba7e5'
            t.style.padding = '0.5em';
            t.style.margin = '0.5em 0';
            t.style.borderRadius = '6px'
        });
        let logo = document.querySelector('#LoginDefault_imgUse_TP');
        if (logo) {
            removeEmptyElement(logo);
        }
        document.querySelectorAll('td, img').forEach(x => {
            var regexString = /C\d(Back)?\.gif/g;
            if (typeof x.src !== 'undefined') {
                if (x.src.match(regexString)) {
                    removeEmptyElement(x);
                }
            }
            if (x.style.backgroundImage.match(regexString)) {
                removeEmptyElement(x);
            }
        });
        function removeEmptyElement(element) {
            let outerNode = element.parentNode;
            while (outerNode && outerNode.innerText.trim().length === 0) {
                outerNode.remove()
                outerNode = outerNode.parentNode;
            }
            element.remove();
        }
    }
    return;
}

/*
===================
Main Page Injection
===================
*/

let emptyImage = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
let customCss = 'https://cdn.jsdelivr.net/gh/mt-hack/nptu-redux/nptu-redux.min.css';
let raisedButtonClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored';
let mainElement = document.querySelector('frame') || document.querySelector('form');
let mainWindow = mainElement.contentWindow || mainElement.ownerDocument.defaultView;
let frameElement = mainWindow.frameElement || mainWindow;
frameElement.onload = function () {
    let contentWindow = frameElement.contentWindow || frameElement;
    if (contentWindow.WebForm_OnSubmit) {
        contentWindow.WebForm_OnSubmit = function () {
            toggleOverlay(mainWindow.document);
        }
    }

    let contentBody = mainWindow.document.body;
    let currentPage = contentBody.querySelector('body>form');
    injectStyle(mainWindow.document.head, 'https://fonts.googleapis.com/icon?family=Material+Icons');
    injectStyle(mainWindow.document.head, 'https://code.getmdl.io/1.3.0/material.teal-indigo.min.css');
    injectStyle(mainWindow.document.head, customCss);
    if (options.locationSelectionPage.includes(currentPage.name)) {
        if (options.enableClassroomShortcut) {
            createQuickLocationSelection(contentBody);
        }
        return;
    }
    if (options.insturctorShortcutPage.includes(currentPage.name)) {
        if (options.enableInstructorShortcut) {
            createInstructorShortcut(contentBody);
        }
        return;
    }
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
        if (options.enableClassroomAutofillOnSelect) {
            injectTableAutoFillByClassroomType(contentBody);
        }
        for (var key in subjectGroups) {
            injectTableAutofillBySubjectId(contentBody, key, subjectGroups[key]);
        }
    }
    // Experimental features
    if (options.enableExperimental) {
        // Table image export feature; currently buggy
        options.tableExportWhitelist.forEach(x=>{
            let tableData = contentBody.querySelectorAll(`table[id*=${x}]`);
            for (let i = 0, ti = tableData.length; i < ti; i++) {
                injectTableDownload(tableData[i]);
            }
        })
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
                    <div class="hoverable" id="page-name">
                        ${moduleName}
                    </div>
                </div>`;
    }
    //  #endregion
    //    #region [Display] Semester
    let semesterName = contentBody.querySelector('#CommonHeader_lblYSC').innerText.replace(/[:：]/g, '');
    let oldSemSwitch = contentBody.querySelector('#CommonHeader_ibtChgSYearSeme');
    if (semesterName) {
        newHeaderHtml += `<div><i class="material-icons">event</i>`;
    }
    if (oldSemSwitch) {
        newHeaderHtml += `
                <label class="text clickable" id="semester-name" onclick='this.nextElementSibling.click();'>${semesterName}</label>
                <input id=${oldSemSwitch.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldSemSwitch.name} name=${oldSemSwitch.name} title=${oldSemSwitch.title}>`;
    } else {
        newHeaderHtml += `<div class="hoverable" id="semester-name">${semesterName}</div>`;
    }
    newHeaderHtml += `</div>`;
    //  #endregion
    newHeaderHtml += `</div><div class="sub container" id="user-info">`;
    //    #region [Display] Username
    let loginName = contentBody.querySelector('#CommonHeader_lblName').innerText;
    if (loginName) {
        newHeaderHtml += `
                <div>
                    <i class="material-icons">person</i>
                    <div class="hoverable" id="user-name">
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
                    <div class="hoverable" id="user-count">
                        ${onlineUsers}
                    </div>
                </div>`;
    }
    //  #endregion
    newHeaderHtml += `</div><div class="alt buttons container right">`;
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
    let dataHeader = contentBody.querySelector('div[id*=dgData_Header]');
    let dataContent = contentBody.querySelector('div[id*=dgData_Content]');
    if (!dataHeader || !dataContent) {
        log('Valid table not found, skipping...');
        return;
    }
    let dataFixedGrid = dataHeader.querySelector('table[id*=dgData_Header_Fixed_Grid]');
    let dataFixedContent = dataContent.querySelector('table[class=DgTable]');
    dataFixedContent.insertAdjacentHTML('afterbegin', dataFixedGrid.innerHTML);
    dataHeader.remove();
    let fixedContent = dataContent.querySelector('div[id*=dgData_Content_Freeze]');
    if (fixedContent) {
        fixedContent.remove()
    }
    dataContent.childNodes.forEach(node => {
        node.style.overflow = null;
        node.style.width = null;
        node.style.height = null;
        node.style.position = null;
        node.style.top = null;
        node.style.left = null;
        node.style.right = null;
        node.style.bottom = null;
    })
    let subjectColumns = dataContent.querySelectorAll('td:nth-child(6)');
    subjectColumns.forEach(x => {
        x.style.position = 'sticky';
        x.style.left = 0;
        x.style.background = 'rgba(100,200,100,0.9)';
    })
    let tableRows = dataContent.querySelectorAll('tr');
    if (tableRows) {
        tableRows.forEach(x => {
            x.removeAttribute('onclick');
            x.addEventListener('click', function () {
                if (this.style.backgroundColor === 'rgb(221, 238, 242)') {
                    this.style.backgroundColor = '#fff'
                } else {
                    this.style.backgroundColor = "rgb(221, 238, 242)"
                }
            });
        });
    }
}

function injectTableAutoFillByClassroomType(contentBody) {
    let selectGroups = contentBody.querySelectorAll('select[id*=ddlROOM_GROUP]');
    selectGroups.forEach(selectElement => {
        selectElement.addEventListener('change', function () {
            let parentRow = this.parentNode.parentNode;
            if (!parentRow) {
                throw "Parent row cannot be found"
            }
            let maxStudentInput = parentRow.querySelector('input[id*=txtSTD_MAX]');
            if (!maxStudentInput) {
                throw "Max student input cannot be found"
            }
            if (this.options[this.selectedIndex].text.includes('普通教室')) {
                maxStudentInput.value = 49
                maxStudentInput.style.backgroundColor = 'antiquewhite'
            }
            if (this.options[this.selectedIndex].text.includes('大教室') ||
                this.options[this.selectedIndex].text.includes('視聽教室')) {
                maxStudentInput.value = 60
                maxStudentInput.style.backgroundColor = 'antiquewhite'
            }
        })
    })
}

function injectTableAutofillBySubjectId(contentBody, subjectId, studentsInSubject) {
    let ownerDocument = contentBody.ownerDocument;
    let results = ownerDocument.evaluate(`//span[contains(.,"${subjectId}")]`, ownerDocument);
    const nodes = [];
    let node = results.iterateNext();
    while (node) {
        nodes.push(node);
        node = results.iterateNext();
    }
    nodes.forEach(n => {
        let parentRow = n.parentNode.parentNode;
        if (!parentRow) {
            log("Parent row not found")
            return;
        }
        let maxStudentInput = parentRow.querySelector('input[id*=txtSTD_MAX]');
        if (!maxStudentInput) {
            log("Max student input cannot be found")
            return;
        }
        maxStudentInput.value = studentsInSubject
        maxStudentInput.style.backgroundColor = 'green'
    });
}

// Add export options for spreadsheet printing
function printFix(contentBody) {
    let printButtons = contentBody.querySelectorAll("a[id*=hylPrint]");
    if (printButtons.length > 0) {
        printButtons.forEach(printButton => {
            if(!(/crystal[\d]\/.*\.rpt/gi.test(printButton.href))){
                return;
            }
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
                html: `
                        <option value="pdf">PDF (Adobe PDF)</option>
                        <option value="xls">XLS (97-2003 Excel 表格)</option>
                        <option value="ods">ODS (OpenDocument 表格)</option>
                        <option value="rtf">RTF (富文字)</option>
                        <option value="txt">TXT (純文字)</option>
                    `
            });

            // change print button
            let exportLinkTextContainer = make({
                el: 'div',
            });
            let exportLinkIcon = make({
                el: 'i',
                class: 'material-icons'
            })
            exportLinkIcon.appendChild(document.createTextNode('print'));
            let exportLinkText = make({
                el: 'span',
                class: 'print-text',
                attr:{
                    style: 'font-family: var(--msft-fonts);'
                }
            })
            exportLinkText.appendChild(document.createTextNode('點此下載報表'));
            exportLinkTextContainer.appendChild(exportLinkIcon);
            exportLinkTextContainer.appendChild(exportLinkText);
            let exportLink = make({
                el: 'a',
                class: raisedButtonClassnames,
                attr: {
                    target: '_blank',
                    href: printButton.href,
                    title: printButton.title,
                    style: 'display: flex; align-items: center; text-decoration: none;'
                }
            });
            exportLink.appendChild(exportLinkTextContainer);
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

function organizeCourseList(contentBody) {
    let openIdList = contentBody.querySelector('select[name*=ddlOPEN_ID]');
    if (openIdList) {
        let incompleteGroup = make({
            el: 'div',
            class: 'menu container'
        });
        let incompleteText = make({
            el: 'div',
            class: 'text container'
        });
        let incompleteHeader = createHeader('尚未排課', 'warning');
        incompleteHeader.style.backgroundColor = '#b71c1c';
        incompleteGroup.appendChild(incompleteHeader);

        let completeGroup = make({
            el: 'div',
            class: 'menu container'
        });
        let completeText = make({
            el: 'div',
            class: 'text container'
        });
        let completeHeader = createHeader('已排課', 'check_circle');
        completeGroup.appendChild(completeHeader);

        let idListOptions = openIdList.querySelectorAll('option');
        idListOptions.forEach(option => {
            let textElement = make({
                el: 'a',
                class: 'class-option'
            });
            textElement.innerText = option.innerText;
            textElement.addEventListener('click', function(){
                option.parentNode.selectedIndex = option.index;
                option.parentNode.onchange();
            });
            if (/\d\/\d/g.test(option.innerText)) {
                completeText.appendChild(textElement);
                completeText.appendChild(document.createElement('br'));
            } else {
                if (!option.innerText.includes('專題') && !option.innerText.includes('檢定')) {
                    incompleteText.appendChild(textElement);
                    incompleteText.appendChild(document.createElement('br'));
                }
            }
        });
        completeGroup.appendChild(completeText);
        incompleteGroup.appendChild(incompleteText);
        let menuContainer = contentBody.querySelector('.menu.container');
        // TODO: but what about the header appended?
        if (incompleteGroup.childNodes.length > 0) {
            menuContainer.appendChild(incompleteGroup);
        }
        if (completeGroup.childNodes.length > 0) {
            menuContainer.appendChild(completeGroup);
        }
    }
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
function createInstructorShortcut(contentBody) {
    let firstTable = contentBody.querySelector('table');
    if (!firstTable) {
        throw "Table element does not exist; failed to inject instructor shortcuts."
    }
    let selectionContainer = make({
        el: 'div',
        class: 'quick-selection container',
        attr: {
            'style': 'display: grid; grid: auto-flow dense/repeat(3, auto);'
        }
    });
    for (var key in instructorShortcuts) {
        let button = createShortcutButton(key);
        button.key = key;
        button.keyValue = instructorShortcuts[key];
        button.shouldAutoSubmit = options.enableShortcutAutoSubmit;
        button.addEventListener('click', function (event) {
            let ddlEmployeeSelection = contentBody.querySelector('select[id*=ddlEMP_ID]');
            if (!ddlEmployeeSelection) {
                throw "Failed to the obtain employee selection dropdown menu."
            }
            log(`${event.currentTarget.key}: ${event.currentTarget.keyValue}`);
            ddlEmployeeSelection.value = event.currentTarget.keyValue;
            if (event.currentTarget.shouldAutoSubmit) {
                let submitButton = contentBody.querySelector('input[id*=ibtSave]');
                submitButton.click();
            }
        });
        selectionContainer.appendChild(button);
    }
    firstTable.appendChild(selectionContainer);
}
function createQuickLocationSelection(contentBody) {
    let firstTable = contentBody.querySelector('table');
    if (!firstTable) {
        throw "Table element does not exist; failed to inject location shortcuts."
    }
    let selectionContainer = make({
        el: 'div',
        class: 'quick-selection container',
        attr: {
            'style': 'display: grid; grid: auto-flow dense/repeat(3, auto);'
        }
    });
    for (var key in locationShortcuts) {
        let button = createShortcutButton(key);
        button.key = key;
        button.keyValue = locationShortcuts[key];
        button.shouldAutoSubmit = options.enableShortcutAutoSubmit;
        button.addEventListener('click', function (event) {
            let ddlRoomSelection = contentBody.querySelector('select[id*=ddlROOM_ID]');
            if (!ddlRoomSelection) {
                throw "Failed to the obtain room selection dropdown menu."
            }
            log(`${event.currentTarget.key}: ${event.currentTarget.keyValue}`);
            ddlRoomSelection.value = event.currentTarget.keyValue;
            if (event.currentTarget.shouldAutoSubmit) {
                let submitButton = contentBody.querySelector('input[id*=ibtSave]');
                submitButton.click();
            }
        });
        selectionContainer.appendChild(button);
    }
    firstTable.appendChild(selectionContainer);
}
function createShortcutButton(text) {
    let button = make({
        el: 'div',
        class: 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect',
        attr: {
            'style': 'margin: .5em'
        }
    });
    button.innerText = text;
    return button;
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
    if (overlay.style.display === 'none') {
        overlay.style.opacity = 0.75;
        overlay.style.display = 'flex';
    } else {
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
            attr: {
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