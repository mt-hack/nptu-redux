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
// @version 1.2.2
// ==/UserScript==

/* 
=========================================================
User configurable options 
=========================================================
*/

let options = {
    // Beautifies login page (WIP)
    enableLoginPageMod: false,
    // Enables button replacement (design WIP)
    enableButtonReplacement: false,
    // Enables grade widget (Student accounts only)
    enableGradeOnHome: true,
    // Enables absence widget (Student accounts only)
    enableAbsenceOnHome: true,
    // Shows the old header in case of component breakage
    enableMaterialHeader: true,
    // Enables custom export options for printing
    enableCustomExport: true,
    // Enables max student number autofill based on classroom selection (Employee accounts only)
    enableClassroomAutofillOnSelect: true,
    // Enables classroom shortcut  (Employee accounts only)
    enableClassroomShortcut: true,
    // Enables instructor shortcut (Employee accounts only)
    enableInstructorShortcut: true,
    // Enables shortcut auto submit (Employee accounts only)
    enableShortcutAutoSubmit: true,
    // Enables experimental features (use at your own risk!)
    enableExperimental: true,
    // Disables custom exports for problematic pages
    customExportBlacklist: ["A0551RPage"],
    // Pages whose tables need to be fixed; works like a whitelist
    tableFixWhitelist: ["A0432SPage", "A0433SPage"],
    locationSelectionPage: ["A0413A02Page"],
    instructorShortcutPage: ["A0413S1Page"],
    // Enables table downloading on these table/div IDs
    tableExportWhitelist: ["A0515S1_dgData", "A0515S_dgData", "A0809Q_dgData", "A0702S1_dgData", "B0105S_dgData", "B0208S_dgData", "A0425S_dgData", "B4002S_dgData", "A0413S_dgData_Content", "A0423S_dgData_Content"],
    isFlexRowWhitelist: ["A0428S3Page", "B4002SPage"]
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
MAIN INIT
*/

let emptyImage = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
let customCss = 'https://cdn.jsdelivr.net/gh/mt-hack/nptu-redux/nptu-redux.min.css';
let raisedButtonClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent';
let raisedButtonAltClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored';
let raisedButtonFlatClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect';
let mainElement = document.querySelector('frame') || document.querySelector('form');
let mainWindow = mainElement.contentWindow || mainElement.ownerDocument.defaultView;
let frameElement = mainWindow.frameElement || mainWindow;

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

if (window.location.href.match(/Web\/Secure\//g) && options.enableLoginPageMod) {
    injectStyle(mainWindow.document.head, 'https://code.getmdl.io/1.3.0/material.teal-pink.min.css');
    document.querySelector('form').appendChild(make({
        el: 'style',
        html: `    
            #button-container>.container{
                margin: 0.5em;
            }
            #button-container{
                display: grid;
                grid: auto-flow dense/repeat(3,auto);
                padding-bottom: 4em;
                max-width: 60vh;
            }
            #nptu-redux-header{
                height: 15vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #nptu-redux-header>.header-text{
                font-size: 3em;
                text-decoration: none;
                color: #eee;
            }
            @-webkit-keyframes GradientBackground {
                0%{background-position:0% 50%}
                50%{background-position:100% 51%}
                100%{background-position:0% 50%}
            }
            @-moz-keyframes GradientBackground {
                0%{background-position:0% 50%}
                50%{background-position:100% 51%}
                100%{background-position:0% 50%}
            }
            @keyframes GradientBackground {
                0%{background-position:0% 50%}
                50%{background-position:100% 51%}
                100%{background-position:0% 50%}
            }
            body{
                background: linear-gradient(270deg, #641143, #3B1255, #251758);
                background-size: 400% 400%;
                animation: GradientBackground 60s ease infinite;
                color: #ddd;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Microsoft YaHei UI', 'Microsoft JhengHei';
            }
        `
    }));
    let widthDummy = document.querySelector("#LoginDefault_txtScreenWidth");
    if (widthDummy) {
        widthDummy.style.display = "none";
    }
    let heightDummy = document.querySelector("#LoginDefault_txtScreenHeight");
    if (heightDummy) {
        heightDummy.style.display = "none";
    }
    let sidebarImages = document.querySelectorAll('#LoginDefault_imgUse_TP, #LoginStd_imgMain, [src*="P1New.gif"], [src*="P5New.gif"], [src*="P4New.gif"], .auto-style3');
    if (sidebarImages) {
        sidebarImages.forEach(x => {
            x.remove();
        })
    }
    let headerImage = document.querySelector('[style*="T1_back"], [style*="T1_Std_back"]');
    if (headerImage) {
        let newHeader = make({
            el: 'header',
            id: 'nptu-redux-header',
            html: "<a class='header-text' href='https://webap.nptu.edu.tw'>🏫 國立屏東大學 (NPTU-Redux)</span>"
        })
        headerImage.parentNode.replaceChild(newHeader, headerImage);
    }
    let loginButtons = document.querySelectorAll("input[id^=LoginDefault]");
    let mainTable = document.querySelector("#TableMain");
    if (loginButtons && mainTable) {
        let newButtonContainer = make({
            el: 'content',
            class: 'container',
            id: 'button-container'
        });
        loginButtons.forEach(x => {
            let subButtonContainer = make({
                el: 'div',
                class: 'container'
            })
            x.style.borderRadius = "10px";
            subButtonContainer.appendChild(x);
            newButtonContainer.appendChild(subButtonContainer);
        })
        mainTable.parentNode.replaceChild(newButtonContainer, mainTable);
    }
    return;
}

/*
===================
Main Page Injection
===================
*/
frameElement.onload = function () {
    let contentWindow = frameElement.contentWindow || frameElement;
    if (contentWindow.WebForm_OnSubmit) {
        contentWindow.WebForm_OnSubmit = function () {
            toggleOverlay(mainWindow.document);
        }
    }

    let contentBody = mainWindow.document.body;
    let currentPage = contentBody.querySelector('body>form');
    if (!currentPage) {
        log("Current page cannot be detected; assuming injected frame.");
        return;
    }
    log(`Current page: ${currentPage.name}`)
    injectStyle(mainWindow.document.head, 'https://fonts.googleapis.com/icon?family=Material+Icons');
    injectStyle(mainWindow.document.head, 'https://code.getmdl.io/1.3.0/material.teal-pink.min.css');
    injectStyle(mainWindow.document.head, customCss);
    if (options.locationSelectionPage.includes(currentPage.name)) {
        if (options.enableClassroomShortcut) {
            createQuickLocationSelection(contentBody);
        }
        return;
    }
    if (options.instructorShortcutPage.includes(currentPage.name)) {
        if (options.enableInstructorShortcut) {
            createInstructorShortcut(contentBody);
        }
        return;
    }
    if (options.enableMaterialHeader) {
        injectHeader(contentBody);
    }
    pageCleanup(contentBody, options.isFlexRowWhitelist.includes(currentPage.name));
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
    if (options.tableFixWhitelist.includes(currentPage.name)) {
        tableFix(contentBody);
        if (options.enableClassroomAutofillOnSelect) {
            injectTableAutoFillByClassroomType(contentBody);
        }
        for (var key in subjectGroups) {
            injectTableAutofillBySubjectId(contentBody, key, subjectGroups[key]);
        }
    }
    options.tableExportWhitelist.forEach(x => {
        contentBody.querySelectorAll(`table[id*=${x}], div[id*=${x}]`).forEach(table => {
            injectTableDownload(table);
        })
    })
    if (currentPage.name === "A1007SPage" || currentPage.name === "A1014SPage") {
        injectFillAllOptions(contentBody);
    }
    if (currentPage.name === "B4002SPage") {
        injectCheckInHelper(contentBody);
    }
    if (options.enableButtonReplacement) {
        buttonReplacement(contentBody);
    }
    organizeCourseList(contentBody);
    setupClipboard(contentBody);

    // Experimental features
    if (options.enableExperimental) {}
};

function injectCheckInHelper(contentBody) {
    let tabs = contentBody.querySelector('[id*=htbMenu]');
    let punchInField = contentBody.querySelector('input[id*=txtPUNCH_TM]');
    let tabsParentNode = tabs.parentNode;
    if (!tabs || !punchInField) {
        return;
    }
    let toolsContainer = make({
        el: 'div',
        class: 'container',
        id: 'tools-container'
    });
    let toolsHeader = createHeader("常用工具 Check-in Helper", "info");
    let buttonsContainer = make({
        el: 'div',
        class: 'help container',
        id: 'help-btn-container'
    });

    let insertTodayButton = createShortcutButton("今天", undefined, "alt");
    insertTodayButton.addEventListener('click', () => {
        let dateField = contentBody.querySelector('input[id*=txtPUNCH_DT]');
        if (dateField) {
            dateField.value = getChineseYear();
        }
    })
    let timeHelperContainer = makeGenericContainer();
    timeHelperContainer.appendChild(makeChipText("插入常用時間"));
    timeHelperContainer.appendChild(insertTodayButton);
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 8, 0));
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 8, 0));
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 10, 0));
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 12, 0));
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 13, 30));
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 15, 30));
    timeHelperContainer.appendChild(timeButtonFactory(contentBody, 17, 30));
    buttonsContainer.appendChild(timeHelperContainer);

    let lateCheckinContainer = makeGenericContainer();
    lateCheckinContainer.appendChild(makeChipText("插入補打卡原因"));
    lateCheckinContainer.appendChild(excuseFactory(contentBody, "‍"));
    lateCheckinContainer.appendChild(excuseFactory(contentBody, "工作繁忙"));
    lateCheckinContainer.appendChild(excuseFactory(contentBody, "忘記"));
    buttonsContainer.appendChild(lateCheckinContainer);

    let workDescriptionContainer = makeGenericContainer();
    workDescriptionContainer.appendChild(makeChipText("插入工作內容"));
    workDescriptionContainer.appendChild(workDescriptionButtonFactory(contentBody, "‍文書處理"));
    workDescriptionContainer.appendChild(workDescriptionButtonFactory(contentBody, "資料彙整"));
    workDescriptionContainer.appendChild(workDescriptionButtonFactory(contentBody, "‍剪輯影片"));
    workDescriptionContainer.appendChild(workDescriptionButtonFactory(contentBody, "‍照片處理"));
    buttonsContainer.appendChild(workDescriptionContainer);

    toolsContainer.appendChild(toolsHeader);
    toolsContainer.appendChild(buttonsContainer);
    toolsContainer.appendAfter(tabsParentNode);
}

function getChineseYear(date = undefined) {
    date = date === undefined ? new Date() : date;
    return `${date.getFullYear()-1911}/${(date.getMonth() + 1).pad(2)}/${date.getDate().pad(2)}`;
}

function makeChipText(text) {
    return make({
        el: 'span',
        class: 'mdl-chip',
        html: `<span class='mdl-chip__text'>${text}</span>`
    });
}

function makeGenericContainer() {
    return make({
        el: 'div',
        attr: {
            style: "display: flex; align-items: center;"
        }
    })
}

function workDescriptionButtonFactory(body, desc) {
    let workDescButton = createShortcutButton(desc, undefined, "alt");
    workDescButton.addEventListener('click', () => {
        let workDescField = body.querySelector('input[id*=txtJOB_NOTES]');
        if (workDescField) {
            workDescField.value = desc
        }
    })
    return workDescButton;
}

function excuseFactory(body, excuse) {
    let excuseDescriptor = excuse.match(/[\u200B-\u200D\uFEFF]/g) ? "插入空白字元" : excuse;
    let excuseButton = createShortcutButton(excuseDescriptor, undefined, "alt");
    excuseButton.addEventListener('click', () => {
        let excuseField = body.querySelector('input[id*=txtFILL_NOTES]');
        if (excuseField) {
            excuseField.value = excuse
        }
    })
    return excuseButton;
}

function timeButtonFactory(body, hour, min) {
    let timeButton = createShortcutButton(`${hour.pad(2)}:${min.pad(2)}`, undefined, "alt");
    timeButton.addEventListener('click', () => {
        let timePunch = body.querySelector('input[id*=txtPUNCH_TM]');
        if (timePunch) {
            let randomMin = Math.floor(Math.random() * Math.floor(10));
            let newMin = Math.random() > 0.5 && (min - randomMin) > 0 ? min - randomMin : min + randomMin;
            newMin = newMin < 60 ? newMin : 59;
            timePunch.value = `${hour.pad(2)}:${newMin.pad(2)}`;
        }
    })
    return timeButton;
}

function injectFillAllOptions(contentBody) {
    let surveyAnswerInputs = contentBody.querySelectorAll("input[id*='rblANSWER']")
    let surveyTable = contentBody.querySelector('#A1007A_dgData') || contentBody.querySelector('#A1014A_dgData');
    if (surveyAnswerInputs.length != 0 && surveyTable) {
        let buttonContainer = make({
            el: "div",
            class: "container"
        })
        let stronglyAgreeBtn = createShortcutButton("非常同意");
        let agreeBtn = createShortcutButton("同意");
        let neutralBtn = createShortcutButton("普通");
        let disagreeBtn = createShortcutButton("不同意");
        let stronglyDisagreeBtn = createShortcutButton("很不同意");
        stronglyAgreeBtn.addEventListener("click", () => {
            checkAllInput(surveyTable, "rblANSWER_0")
        });
        agreeBtn.addEventListener("click", () => {
            checkAllInput(surveyTable, "rblANSWER_1")
        });
        neutralBtn.addEventListener("click", () => {
            checkAllInput(surveyTable, "rblANSWER_2")
        });
        disagreeBtn.addEventListener("click", () => {
            checkAllInput(surveyTable, "rblANSWER_3")
        });
        stronglyDisagreeBtn.addEventListener("click", () => {
            checkAllInput(surveyTable, "rblANSWER_4")
        });
        buttonContainer.appendChild(stronglyAgreeBtn);
        buttonContainer.appendChild(agreeBtn);
        buttonContainer.appendChild(neutralBtn);
        buttonContainer.appendChild(disagreeBtn);
        buttonContainer.appendChild(stronglyDisagreeBtn);
        surveyTable.parentNode.prepend(buttonContainer);
    }
}

function checkAllInput(contentBody, id) {
    contentBody.querySelectorAll(`input[id*=\"${id}\"]`).forEach(x => {
        x.checked = true
    });
}

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
    // For some reason they're using this for print detection? What the hell guys
    let textUsedDummy = contentBody.querySelector('#CommonHeader_txtUsed');
    if (textUsedDummy) {
        newHeaderHtml += textUsedDummy.outerHTML;
    }
    newHeaderHtml += `</div></div>`;
    //  #endregion
    let newHeader = make({
        el: "header",
        html: newHeaderHtml
    });
    componentHandler.upgradeElement(newHeader);

    let mainForm = mainWindow.document.body.querySelector('body>form');
    mainForm.prepend(newHeader);
    oldHeader.remove();
}

// Replaces each MainBody (td) with a div
function pageCleanup(contentBody, shouldRenderInRows) {
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
    let printBtns = contentBody.querySelectorAll('[id*=hylPrint]');
    let menuElements = [];
    let elementDiv = null;
    if (shouldRenderInRows) {
        elementDiv = make({
            el: 'div',
            class: 'menu container'
        });
    }
    mainBodies.forEach(element => {
        if (!isSafeToDelete(element)) {
            // identifier for menu tabs
            if (!element.querySelector('td.UnUse')) {
                if (!shouldRenderInRows) {
                    elementDiv = make({
                        el: 'div',
                        class: 'menu container',
                        html: element.innerHTML
                    });
                } else {
                    elementDiv.innerHTML += element.innerHTML;
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
        if (!elementDiv.querySelector('[id*=hylPrint]')) {
            printBtns.forEach(x => {
                elementDiv.appendChild(x);
            });
        }
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

    let dateInputFields = contentBody.querySelectorAll('input[id$=txtEND_DT], input[id$=txtBEGIN_DT]');
    dateInputFields.forEach(x => {
        x.autocomplete = "off";
    })
}

function buttonReplacement(contentBody) {
    let types = Object.keys(buttonTypes);
    types.forEach(type=>{
        let buttonType = buttonTypes[type];
        let oldButtons = contentBody.querySelectorAll(`[id$=ibt${buttonType.baseId}], [id$=ibt${buttonType.baseId}Down], [id$=ibt${buttonType.baseId}Up]`);
        if (oldButtons){
            oldButtons.forEach(oldBtn =>{
                let newBtn = createShortcutButton(buttonType.label, buttonType.icon, buttonType.color);
                oldBtn.style.display = "none";
                newBtn.addEventListener('click', function (e) {
                    this.nextElementSibling.click();
                })
                newBtn.appendBefore(oldBtn);
            })
        }
    })
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
    let printButtons = contentBody.querySelectorAll("a[id$=hylPrint]");
    if (printButtons.length > 0) {
        log("Injecting custom export options...");
        printButtons.forEach(printButton => {
            if (!(/crystal[\d]\/.*\.rpt/gi.test(printButton.href))) {
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
                attr: {
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
            textElement.addEventListener('click', function () {
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
    let svgDownloadBtn = createShortcutButton("存成 SVG", "save_alt");
    let pngDownloadBtn = createShortcutButton("存成 PNG", "save_alt");
    newTableContainer.prepend(svgDownloadBtn);
    newTableContainer.prepend(pngDownloadBtn);
    table.parentNode.replaceChild(newTableContainer, table);
    // define table again
    table = newTableContainer.querySelector('table');
    pngDownloadBtn.addEventListener('click', function () {
        toggleOverlay(table.getRootNode());
        domtoimage.toPng(table).then(function (url) {
            let outputName = `${table.id || "image"}.png`
            GM_download(url, outputName);
            toggleOverlay(table.getRootNode());
        });
    });
    svgDownloadBtn.addEventListener('click', function () {
        toggleOverlay(table.getRootNode());
        domtoimage.toSvg(table).then(function (url) {
            let outputName = `${table.id || "image"}.svg`
            GM_download(url, outputName);
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

function createShortcutButton(text, icon = undefined, style = "colored") {
    let classnames = "";
    switch (style) {
        case "colored":
            classnames = raisedButtonClassnames;
            break;
        case "alt":
            classnames = raisedButtonAltClassnames;
            break;
        case "flat":
        default:
            classnames = raisedButtonFlatClassnames;
            break;
    }
    let button = make({
        el: 'div',
        class: classnames,
        attr: {
            'style': 'margin: .5em'
        }
    });
    if (icon != undefined) {
        let iconText = make({
            el: 'i',
            class: 'material-icons'
        });
        iconText.innerText = icon;
        button.appendChild(iconText);
    }
    button.appendChild(make({
        el: 'span',
        html: text
    }));
    componentHandler.upgradeElement(button);
    return button;
}

/* Helper Method */

// Copied from GitHub Dark Script
// https://github.com/StylishThemes/GitHub-Dark/blob/master/LICENSE
function make(obj) {
    let key,
        el = document.createElement(obj.el);
    if (obj.id) {
        el.id = obj.id;
    }
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

// https://stackoverflow.com/a/32135318
Element.prototype.appendAfter = function (element) {
    element.parentNode.insertBefore(this, element.nextSibling);
}, false;
Element.prototype.appendBefore = function (element) {
    element.parentNode.insertBefore(this, element);
}, false;

// modified from https://stackoverflow.com/a/10073788
Number.prototype.pad = function (width, z) {
    z = z || '0';
    let n = this + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Define button types (why doesn't JS support enum reeeee)
const buttonTypes = {
    SEARCH: {
        icon: 'search',
        label: '查詢',
        color: 'alt',
        baseId: 'Query'
    },
    SEARCH_AGAIN: {
        icon: 'search',
        label: '重新查詢',
        color: 'alt',
        baseId: 'BackQuery'
    },
    BACK: {
        icon: 'arrow_back',
        label: '回上層',
        color: 'flat',
        baseId: 'Back'
    },
    PRINT: {
        icon: 'print',
        label: '產生報表',
        color: 'alt',
        baseId: 'Print'
    },
    CANCEL: {
        icon: 'cancel',
        label: '取消',
        color: 'colored',
        baseId: 'Cancel'
    },
    DELETE: {
        icon: 'delete',
        label: '刪除',
        color: 'colored',
        baseId: 'Delete'
    },
    LOOKUP: {
        icon: 'pageview',
        label: '帶出',
        color: 'colored',
        baseId: 'LookUp'
    },
    ADD: {
        icon: 'add',
        label: '新增',
        color: 'alt',
        baseId: 'Add'
    },
    SAVE: {
        icon: 'save',
        label: '存檔',
        color: 'alt',
        baseId: 'Save'
    }
}