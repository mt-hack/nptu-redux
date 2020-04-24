// ==UserScript==
// @name NPTU Redux
// @description Provides QOL improvements for the web control panel of Taiwan Pingtung University
// @license MIT
// @author MT.Hack
// @grant GM_setClipboard
// @grant GM_download
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_notification
// @inject-into auto
// @require https://cdn.jsdelivr.net/npm/dom-to-image-more@2.8.0/dist/dom-to-image-more.min.js
// @require https://code.getmdl.io/1.3.0/material.min.js
// @match *://webap*.nptu.edu.tw/*
// @downloadUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @updateUrl https://raw.githubusercontent.com/mt-hack/nptu-redux/master/nptu-redux.user.js
// @version 1.6.0
// ==/UserScript==

/* 
=========================================================
User configurable options 
=========================================================
*/

const optionIds = {
    STYLIZED_LOGIN: 'enable-login-mod',
    BUTTON_REPLACEMENT: 'enable-new-buttons',
    GRADES_WIDGET: 'enable-grades-widget',
    ABSENCE_WIDGET: 'enable-absence-widget',
    CUSTOM_EXPORTS: 'enable-custom-exports',
    CLASSROOM_AUTOFILL: 'enable-classroom-autofill',
    SURVEY_AUTOFILL: 'enable-survey-autofill',
    CHECKIN_HELPER: 'enable-checkin-helper',
    TABLE_EXPORT: 'enable-table-exports',
    WORK_DESCRIPTIONS: 'work-descriptions'
}

let options = {
    // Beautifies login page (WIP)
    enableLoginPageMod: GM_getValue(optionIds.STYLIZED_LOGIN, true),
    // Enables button replacement (design WIP)
    enableButtonReplacement: GM_getValue(optionIds.BUTTON_REPLACEMENT, true),
    // Enables grade widget (Student accounts only)
    enableGradeOnHome: GM_getValue(optionIds.GRADES_WIDGET, true),
    // Enables absence widget (Student accounts only)
    enableAbsenceOnHome: GM_getValue(optionIds.ABSENCE_WIDGET, true),
    // Enables custom export options for printing
    enableCustomExport: GM_getValue(optionIds.CUSTOM_EXPORTS, true),
    // Enables max student number autofill based on classroom selection (Employee accounts only)
    enableClassroomAutofillOnSelect: GM_getValue(optionIds.CLASSROOM_AUTOFILL, true),
    // Adds buttons that help auto-fill all options in opinion surveys
    enableSurveyAutoFill: GM_getValue(optionIds.SURVEY_AUTOFILL, true),
    // Adds buttons that help speed up the process of checking in
    enableCheckInHelper: GM_getValue(optionIds.CHECKIN_HELPER, true),
    // Enables saving specific tables as images
    enableTableExports: GM_getValue(optionIds.TABLE_EXPORT, true),
    // Enables classroom shortcut  (Employee accounts only)
    enableClassroomShortcut: true,
    // Enables instructor shortcut (Employee accounts only)
    enableInstructorShortcut: true,
    // Enables shortcut auto submit (Employee accounts only)
    enableShortcutAutoSubmit: true,
    // Pages whose tables need to be fixed; works like a whitelist
    tableFixWhitelist: ["A0432SPage", "A0433SPage"],
    locationSelectionPage: ["A0413A02Page"],
    instructorShortcutPage: ["A0413S1Page"],
    // Enables table downloading on these table/div IDs
    tableExportWhitelist: ["A0515S1_dgData", "A0515S_dgData", "A0809Q_dgData", "A0702S1_dgData", "B0105S_dgData", "B0208S_dgData", "A0425S_dgData", "B4002S_dgData", "A0413S_dgData_Content", "A0423S_dgData_Content"],
    isFlexRowWhitelist: ["A0428S3Page", "B4002SPage", "A0428S1Page", "A0428S2Page", "A0428SPage", "A1609QPage", "B1414SPage", "A0711SPage", "A1305SPage"]
};

// Replace the subject groups with your own if you are an employee

let subjectGroups = {
    ENG1001: 30,
    ENG1003: 60,
    ENG1004: 60,
    ENG2001: 30,
    ENG2002: 30,
    ENG2003: 60,
    ENG2005: 60,
    ENG2009: 60,
    ENG2015: 60,
    ENG2027: 30,
    ENG3001: 30,
    ENG3005: 60,
    ENG3007: 8,
    ENG3008: 45,
    ENG3019: 45,
    ENG3040: 60,
    ENG3032: 30,
    ENG2008: 45,
    ENG2028: 30,
    ENG2031: 60,
    ENG2032: 45,
    ENG2033: 45,
    ENG2034: 45,
    ENG3004: 45,
    ENG3009: 60,
    ENG3039: 60,
    ENG3040: 60,
    ENG4001: 30,
    ENG4002: 60,
    ENG4008: 60,
    ENG4014: 45,
    ENG4024: 15,
    ENG4036: 45,
    ENG4037: 30,
    ENG4041: 25,
    ENI0001: 8,
    ENI0005: 25,
    ENI0007: 15,
    ENI1001: 25,
    ENI1007: 25,
    ENI1011: 25,
    ENI1117: 25,
    ENI1135: 25,
    ENI1137: 25,
    ENI1302: 25,
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
    張淑英: '200008978',
    張理宏: '200008741'
}

/* 
=========================================================
LIVE CODE
DO NOT TOUCH THE BELOW UNLESS YOU KNOW WHAT YOU ARE DOING
=========================================================
*/

// Button definitions
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
    },
    CHANGE_SEM: {
        icon: 'event',
        label: '切換學期',
        color: 'alt',
        baseId: 'GsTerm'
    }
}

/*
Prototype helper methods
*/

Element.prototype.cloneElement = function(targetElementName = undefined, targetElementClass = undefined) {
    let newElement = document.createElement(targetElementName || "span");
    newElement.innerHTML = this.innerHTML;
    if (targetElementClass) {
        newElement.classList = targetElementClass;
    } else {
        newElement.classList = this.classList;
    }
    return newElement;
}

Element.prototype.replaceElement = function(newElementType = undefined) {
    let newElement = document.createElement(newElementType || "span");
    this.childNodes.forEach(x => {
        newElement.appendChild(x);
    })
    this.replaceWith(newElement);
}

Element.prototype.appendAfter = function(element) {
    element.parentNode.insertBefore(this, element.nextSibling);
}, false;

Element.prototype.appendBefore = function(element) {
    element.parentNode.insertBefore(this, element);
}, false;

// modified from https://stackoverflow.com/a/10073788
Number.prototype.pad = function(width, z) {
    z = z || '0';
    let n = this + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

let emptyImage = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
let raisedButtonClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent';
let raisedButtonAltClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored';
let raisedButtonFlatClassnames = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect';
let mainElement = document.querySelector('frame') || document.querySelector('form');
if (!mainElement) {
    log('Main frame/form not detected; assuming unknown page.');
    return;
}
let mainWindow = mainElement.contentWindow || mainElement.ownerDocument.defaultView;
let frameElement = mainWindow.frameElement || mainWindow;
let contentWindow = frameElement.contentWindow || frameElement;
if (contentWindow.WebForm_OnSubmit) {
    contentWindow.WebForm_OnSubmit = function() {
        toggleOverlay(mainWindow.document);
    }
}

/*
===================
Image Fix Injection
===================
*/

let images = document.querySelectorAll('*[src*="_EN"]')
images.forEach(img => {
    img.addEventListener('error', function() {
        let englishSuffixRegex = new RegExp(/_en/gi);
        this.src = this.src.replace(englishSuffixRegex, '');
    })
})

/*
===================
CSS Injection
===================
*/

injectStyle(document.head, 'https://fonts.googleapis.com/icon?family=Material+Icons');
injectStyle(document.head, 'https://code.getmdl.io/1.3.0/material.indigo-blue.min.css');
injectCustomCss(document.head);

/*
====================
Homepage Injection
====================
*/

// fix alertify
if (document.querySelector('.alertify-log')) {
    document.querySelectorAll('.alertify-log').forEach(x => {
        let data = { message: x.innerText, timeout: 100000 };
        x.remove();
        let snackBar = make({ el: 'div', class: 'mdl-js-snackbar mdl-snackbar', id: 'material-alertify', html: '<div class="mdl-snackbar__text"></div><button type="button" class="mdl-snackbar__action"></button>' });
        document.body.appendChild(snackBar);
        componentHandler.upgradeElement(snackBar);
        snackBar.MaterialSnackbar.showSnackbar(data);
    })
}

// homepage
if (isHomepage(document)) {
    if (!options.enableLoginPageMod) {
        return;
    }
    let overlay = make({
        el: 'div',
        class: 'overlay',
        html: `<div id="overlay-wave"><div class="wave -one"></div><div class="wave -two"></div><div class="wave -three"></div></div>`
    });
    document.body.appendChild(overlay);
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
        document.body.prepend(newHeader);
        headerImage.remove();
    }
    let javaNote = document.querySelector('a[href*="java.com"]');
    if (javaNote) {
        javaNote.remove();
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
    let copyrightDiv = document.evaluate(`//div[contains(., 'Copyright')]`, document).iterateNext();
    if (copyrightDiv) {
        copyrightDiv.innerHTML = `
        <span>
            <a href="https://github.com/mt-hack/nptu-redux">GitHub</a>
        </span>
        <br>
        <span style="filter: invert(1)">
            Copyright© ${new Date().getFullYear()} by MT.Hack (Still Hsu and its Contributors)
        </span>
        `;
    }
    if (isLoginPage(document)) {
        let loginForm = document.querySelector('table.style1');
        if (!loginForm) {
            return;
        }
        let loginFormContainer = make({
            el: 'section',
            class: 'container',
            id: 'login-container'
        });
        loginForm = loginForm.cloneElement('div', 'login-form');
        loginFormContainer.appendChild(loginForm);
        mainElement.appendChild(loginFormContainer);
        mainElement.querySelector('table').remove();
        let oldLoginBtn = mainElement.querySelector('input[id$=ibtLogin]');
        if (oldLoginBtn) {
            let captchaField = mainElement.querySelector('[id$="rfvCheckCode"]');
            if (captchaField) {
                oldLoginBtn.appendAfter(captchaField);
            }
            let captchaTextField = mainElement.querySelector('[id$="txtCheckCode"]');
            if (captchaTextField) {
                captchaTextField.autocomplete = "off";
            }
            let newLoginBtn = createShortcutButton('登入', 'vpn_key', 'colored');
            newLoginBtn.addEventListener('click', function(e) {
                this.nextElementSibling.click();
            })
            newLoginBtn.appendBefore(oldLoginBtn);
            oldLoginBtn.style.display = 'none';
        }
        let captchaImage = mainElement.querySelector('#imgCaptcha');
        if (captchaImage) {
            captchaImage.addEventListener('click', function(e) {
                this.src = `../Modules/CaptchaCreator.aspx?${Math.random()}`
            })
        }
    }
}

// post-login frame
if (document.querySelector('body>form') && !isHomepage(document)) {
    let contentBody = mainWindow.document.body;
    let currentPage = contentBody.querySelector('body>form');
    if (!frameElement) {
        log('Frame element cannot be detected; assuming unknown page.');
        return;
    }
    log(`Current page: ${currentPage.name}`)
    if (currentPage.name == "Form1") {
        log('Detected sidebar; returning after style injection...');
        return;
    }
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
    injectHeader(contentBody);
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
    if (options.enableButtonReplacement) {
        buttonReplacement(contentBody);
    }
    if (options.enableCustomExport) {
        printFix(contentBody);
    }
    frameElement.onload = function() {
        if (options.tableFixWhitelist.includes(currentPage.name)) {
            tableFix(contentBody);
            if (options.enableClassroomAutofillOnSelect) {
                injectTableAutoFillByClassroomType(contentBody);
            }
            for (var key in subjectGroups) {
                injectTableAutofillBySubjectId(contentBody, key, subjectGroups[key]);
            }
        } else {
            upgradeSelect(contentBody);
        }
        if (options.enableTableExports) {
            options.tableExportWhitelist.forEach(x => {
                contentBody.querySelectorAll(`table[id*=${x}]:not(.injected-frame), div[id*=${x}]:not(.injected-frame)`).forEach(table => {
                    injectTableDownload(table);
                })
            })
        }
        if (options.enableSurveyAutoFill) {
            if (currentPage.name === "A1007SPage" || currentPage.name === "A1014SPage") {
                injectFillAllOptions(contentBody);
            }
        }
        if (options.enableCheckInHelper) {
            if (currentPage.name === "B4002SPage") {
                injectCheckInHelper(contentBody);
            }
        }
        organizeCourseList(contentBody);
        setupClipboard(contentBody);

    }
}

// it's 2020, who still uses frameset??
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset
if (document.querySelector('frameset')) {
    let frames = document.querySelectorAll('frame');
    frames.forEach(x => {
        let newInlineFrame = document.createElement('iframe');
        cloneAttributes(newInlineFrame, x);
        x.replaceWith(newInlineFrame);
    });
    let frameset = document.querySelector('frameset');
    let newBody = document.createElement('body');
    newBody.classList.add('redux-patched-body');
    newBody.innerHTML = frameset.innerHTML;
    frameset.replaceWith(newBody);
}

// injection at base window-level, meaning this will be injected at the top frame
// this will allow us to inject top-body-level content, even if the content is opened as a new frame tab
getOrCreateSettingsLayer(window.parent.document.body);

function upgradeSelect(contentBody) {
    function makeInputContainer() {
        return make({
            el: 'div',
            class: 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label',
            id: 'material-select',
            attr: {
                style: 'width: auto;'
            }
        });
    }
    contentBody.querySelectorAll('select, input[type="text"]').forEach(selectNode => {
        if (selectNode.style.opacity === "0" || selectNode.style.visibility === 'hidden' || selectNode.style.display === 'none' ||
            selectNode.parentNode.classList.contains('is-upgraded')) {
            return;
        }
        // stop hardcoding width reeeeeeee
        selectNode.style.width = "auto";
        let selectContainer = makeInputContainer();
        let selectNodeParent = selectNode.parentNode;
        let previousSibling = _try(() => selectNode.previousSibling.data.trim()) || selectNode.previousElementSibling || selectNode.parentNode.previousElementSibling
        selectNode.classList.add('mdl-textfield__input');
        selectNodeParent.replaceChild(selectContainer, selectNode);
        selectContainer.appendChild(selectNode);
        if (previousSibling && previousSibling.innerText) {
            let placeholderText = make({ el: 'label', text: previousSibling.innerText.replace(/[:：]/g, ''), class: 'mdl-textfield__label' })
            selectContainer.appendChild(placeholderText);
        }
        componentHandler.upgradeElement(selectContainer);
    })
}

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

    let workDescriptions = GM_getValue(optionIds.WORK_DESCRIPTIONS, []);
    if (workDescriptions.length !== 0) {
        let workDescriptionContainer = makeGenericContainer();
        workDescriptionContainer.appendChild(makeChipText("插入工作內容"));
        workDescriptions.forEach(x => {
            workDescriptionContainer.appendChild(workDescriptionButtonFactory(contentBody, x));
        })
        buttonsContainer.appendChild(workDescriptionContainer);
    }

    toolsContainer.appendChild(toolsHeader);
    toolsContainer.appendChild(buttonsContainer);
    toolsContainer.appendAfter(tabsParentNode);
}

function getChineseYear(date = undefined) {
    date = date === undefined ? new Date() : date;
    return `${date.getFullYear() - 1911}/${(date.getMonth() + 1).pad(2)}/${date.getDate().pad(2)}`;
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
    let surveyAnswerInputs = contentBody.querySelectorAll("input[id*='rblANSWER']");
    let surveyTable = contentBody.querySelector('#A1007A_dgData, #A1014A_dgData');
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

// todo: should refactor when possible - it's a mess to navigate through
function injectHeader(contentBody) {
    let oldInnerHeader = contentBody.querySelector('.TableCommonHeader');
    if (!oldInnerHeader) {
        return;
    }
    let oldHeader = oldInnerHeader.parentNode.parentNode;
    let newHeaderHtml = `<div class="top header container"><div class="alt buttons container left">`;
    let oldHome = contentBody.querySelector('#CommonHeader_ibtBackHome');
    if (oldHome) {
        newHeaderHtml += `
                <span for="home-button" class="mdl-tooltip mdl-tooltip--large">首頁</span>
                <label id="home-button" for=${oldHome.id} class='btn hoverable' onclick='toggleOverlay(this.getRootNode()); this.nextElementSibling.click();'>home</label>
                <input id=${oldHome.id} src=${emptyImage} style='display: none;' value='' type="image" name=${oldHome.name} alt=${oldHome.alt} title=${oldHome.title}>`;
    }
    newHeaderHtml += `</div><div class="sub container" id="module-info">`;
    let moduleName = contentBody.querySelector('#CommonHeader_lblModule')
    if (moduleName) {
        newHeaderHtml += `
                <div>
                    <i class="material-icons">dashboard</i>
                    <div class="hoverable" id="page-name">
                        ${moduleName.innerText}
                    </div>
                </div>`;
    }
    let semesterElement = contentBody.querySelector('#CommonHeader_lblYSC');
    if (semesterElement) {
        let semesterName = semesterElement.innerText.replace(/[:：]/g, '');
        let oldSemSwitch = contentBody.querySelector('#CommonHeader_ibtChgSYearSeme');
        if (semesterName) {
            newHeaderHtml += `<div><i class="material-icons">event</i>`;
        }
        if (oldSemSwitch) {
            newHeaderHtml += `
                    <span for="semester-name" class="mdl-tooltip mdl-tooltip--large">切換學期</span>
                    <label id="semester-name" class="text clickable" onclick='this.nextElementSibling.click();'>${semesterName}</label>
                    <input id=${oldSemSwitch.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldSemSwitch.name} name=${oldSemSwitch.name} title=${oldSemSwitch.title}>`;
        } else {
            newHeaderHtml += `<div class="hoverable" id="semester-name">${semesterName}</div>`;
        }
        newHeaderHtml += `</div>`;
    }
    newHeaderHtml += `</div><div class="sub container" id="user-info">`;
    let loginName = contentBody.querySelector('#CommonHeader_lblName');
    if (loginName) {
        newHeaderHtml += `
                <div>
                    <i class="material-icons">person</i>
                    <div class="hoverable" id="user-name">
                        ${loginName.innerText}
                    </div>
                </div>`;
    }
    let onlineUsers = contentBody.querySelector('.CommomHeadstyle2 font');
    if (onlineUsers) {
        newHeaderHtml += `
                <div>
                    <i class="material-icons">people</i>
                    <div class="hoverable" id="user-count">
                        ${onlineUsers.innerText}
                    </div>
                </div>`;
    }
    newHeaderHtml += `</div><div class="alt buttons container right">`;
    let oldPwdBtn = contentBody.querySelector('#CommonHeader_ibtChgPwd');
    if (oldPwdBtn) {
        newHeaderHtml += `
                <span for="change-pw-button" class="mdl-tooltip mdl-tooltip--large">更改密碼</span>
                <label for=${oldPwdBtn.id} id="change-pw-button" class='btn hoverable' onclick='this.nextElementSibling.click();'>lock</label>
                <input id=${oldPwdBtn.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldPwdBtn.name} name=${oldPwdBtn.name} title=${oldPwdBtn.title}>`;
    }
    let oldLogout = contentBody.querySelector('#CommonHeader_ibtLogOut');
    if (oldLogout) {
        newHeaderHtml += `
                <span for="logout-button" class="mdl-tooltip mdl-tooltip--large">登出</span>
                <label for=${oldLogout.id} id="logout-button" class='btn hoverable' onclick='this.nextElementSibling.click();'>exit_to_app</label>
                <input id=${oldLogout.id} src=${emptyImage} style='display: none;' value='' type="image" alt=${oldLogout.name} name=${oldLogout.name} title=${oldLogout.title}>`;
    }
    newHeaderHtml += `</div></div>`;
    let newHeader = make({
        el: "header",
        html: newHeaderHtml,
        class: 'redux-header'
    });
    // For some reason they're using this for print detection? What the hell guys
    let textUsedDummy = contentBody.querySelector('#CommonHeader_txtUsed');
    if (textUsedDummy) {
        textUsedDummy.style.opacity = 0;
        textUsedDummy.style.position = 'absolute';
        textUsedDummy.style.left = '-1px';
        textUsedDummy.style.top = '-1px';
        newHeader.appendChild(textUsedDummy);
    }
    let mainForm = mainWindow.document.body.querySelector('body>form');
    let righthandButtons = newHeader.querySelector('.alt.buttons.container.right');

    let settingsTooltip = make({ el: 'span', text: 'Redux 設定', attr: { for: 'settings-button' }, class: 'mdl-tooltip mdl-tooltip--large' });
    let settingsBtn = make({ el: 'label', id: 'settings-button', class: 'btn hoverable', text: 'settings' });
    settingsBtn.addEventListener('click', function() {
        let settingsOverlay = getOrCreateSettingsLayer(window.parent.document.body);
        toggleVisibility(settingsOverlay);
    })
    righthandButtons.prepend(settingsTooltip);
    righthandButtons.prepend(settingsBtn);
    componentHandler.upgradeElement(newHeader);
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
    types.forEach(type => {
        let buttonType = buttonTypes[type];
        let oldButtons = contentBody.querySelectorAll(`[id$=ibt${buttonType.baseId}], [id$=ibt${buttonType.baseId}Down], [id$=ibt${buttonType.baseId}Up]`);
        if (oldButtons) {
            oldButtons.forEach(oldBtn => {
                let newBtn = createShortcutButton(buttonType.label, buttonType.icon, buttonType.color);
                oldBtn.style.display = "none";
                newBtn.addEventListener('click', function(e) {
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
    absenceFrame.addEventListener('load', function() {
        // remove irrelevant elements
        let frameBody = absenceFrame.contentDocument.body;
        let absenceTable = frameBody.querySelector('table[id*=dgData]');
        let absenceDiv = make({
            el: 'div',
            attr: {
                style: 'display: flex; flex-direction: column; align-items: center;'
            }
        });
        absenceTable.classList.add("injected-frame");
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
    gradesFrame.addEventListener('load', function() {
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
        gradesTable.classList.add("injected-frame");
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
    let subjectHeaderCell = contentBody.ownerDocument.evaluate(`//table[@class="DgTable"]//div[contains(.,"科目")]`, contentBody.ownerDocument).iterateNext();
    if (subjectHeaderCell) {
        let parentTd = subjectHeaderCell.parentNode;
        let parentTr = parentTd.parentNode;
        let index = Array.prototype.indexOf.call(parentTr.children, parentTd) + 1;
        let subjectColumns = dataContent.querySelectorAll(`td:nth-child(${index})`);
        subjectColumns.forEach(x => {
            x.style.position = 'sticky';
            x.style.left = 0;
            x.style.background = 'rgba(100,200,100,0.9)';
            x.style.zIndex = 100;
        })
    } else {
        log('Unable to locate the subject header cell, skipping column sticky.');
    }
    let tableRows = dataContent.querySelectorAll('tr');
    if (tableRows) {
        tableRows.forEach(x => {
            x.removeAttribute('onclick');
            x.addEventListener('click', function() {
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
        selectElement.addEventListener('change', function() {
            let targetValue = -1;
            let parentRow = this.parentNode.parentNode;
            if (!parentRow) {
                throw "Parent row cannot be found"
            }
            let maxStudentInput = parentRow.querySelector('input[id*=txtSTD_MAX]');
            if (!maxStudentInput) {
                throw "Max student input cannot be found"
            }
            if (this.options[this.selectedIndex].text.includes('普通教室')) {
                targetValue = 49
            }
            if (this.options[this.selectedIndex].text.includes('大教室') ||
                this.options[this.selectedIndex].text.includes('視聽教室')) {
                targetValue = 60
            }
            if (targetValue > 0) {
                maxStudentInput.value = targetValue;
                maxStudentInput.style.backgroundColor = 'antiquewhite';
                maxStudentInput.title = "已依照教室類別自動更改人數";
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
            log("Parent row not found");
            return;
        }
        let maxStudentInput = parentRow.querySelector('input[id*=txtSTD_MAX]');
        if (!maxStudentInput) {
            log("Max student input cannot be found");
            return;
        }
        maxStudentInput.value = studentsInSubject;
        maxStudentInput.style.backgroundColor = 'orange';
        maxStudentInput.title = "已依照科目類別自動更改人數";
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
            exportMenuDiv.className = "export-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label";

            // create export label
            let exportLabel = document.createElement("label");
            exportLabel.appendChild(document.createTextNode('匯出選項：'));
            exportLabel.className = "mdl-textfield__label";

            // prepare export menu
            let exportMenu = make({
                el: 'select',
                class: 'export-menu mdl-textfield__input',
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
            componentHandler.upgradeElement(exportDiv);
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
            textElement.addEventListener('click', function() {
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
        if (incompleteText.innerText.length > 0) {
            GM_notification("您有尚未排課之課程！");
        }
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
    pngDownloadBtn.addEventListener('click', function() {
        toggleOverlay(table.getRootNode());
        domtoimage.toPng(table).then(function(url) {
            let outputName = `${table.id || "image"}.png`
            GM_download(url, outputName);
            toggleOverlay(table.getRootNode());
        });
    });
    svgDownloadBtn.addEventListener('click', function() {
        toggleOverlay(table.getRootNode());
        domtoimage.toSvg(table).then(function(url) {
            let outputName = `${table.id || "image"}.svg`
            GM_download(url, outputName);
            toggleOverlay(table.getRootNode());
        });
    });
}

function setupClipboard(contentBody) {
    contentBody.querySelectorAll('.copyable').forEach(element => {
        element.addEventListener('click', function() {
            GM_setClipboard(this.innerText);
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
        class: 'quick-selection container'
    });
    for (var key in instructorShortcuts) {
        let button = createShortcutButton(key);
        button.key = key;
        button.keyValue = instructorShortcuts[key];
        button.shouldAutoSubmit = options.enableShortcutAutoSubmit;
        button.addEventListener('click', function(event) {
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
        class: 'quick-selection container'
    });
    for (var key in locationShortcuts) {
        let button = createShortcutButton(key);
        button.key = key;
        button.keyValue = locationShortcuts[key];
        button.shouldAutoSubmit = options.enableShortcutAutoSubmit;
        button.addEventListener('click', function(event) {
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
        html: text,
        attr: {
            style: 'font-family: var(--msft-fonts);'
        }
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
    if (obj.text) {
        let textnode = document.createTextNode(obj.text);
        el.appendChild(textnode);
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
        (obj.appendTo).appendChild(el);
    }
    return el;
}

function toggleVisibility(element) {
    if (element.classList.contains('popOut')) {
        document.querySelector('body').style.overflow = 'hidden';
        element.classList.replace('popOut', 'popIn');
    } else if (element.classList.contains('popIn')) {
        document.querySelector('body').style.overflow = null;
        element.classList.replace('popIn', 'popOut');
    }
}

function toggleOverlay(document) {
    let overlay = getOrCreateLoadingOverlay(document);
    toggleVisibility(overlay);
}

function getOrCreateLoadingOverlay(document) {
    let overlayContainer = document.querySelector('#redux-overlay-container');
    if (!overlayContainer) {
        overlayContainer = make({
            el: 'section',
            id: 'redux-overlay-container',
            class: 'popOut'
        })
        let overlay = make({
            el: 'div',
            class: 'redux-overlay'
        });
        let spinner = make({
            el: 'div',
            class: 'mdl-spinner mdl-js-spinner is-active',
            id: 'overlay-spinner'
        });
        let loadTxt = make({
            el: 'div',
            class: 'text'
        });
        loadTxt.appendChild(document.createTextNode('載入中...'));
        componentHandler.upgradeElement(spinner);
        overlay.appendChild(spinner);
        overlay.appendChild(loadTxt);
        overlayContainer.appendChild(overlay)
        document.body.prepend(overlayContainer);
    }
    return overlayContainer;
}

function getOrCreateSettingsLayer(baseNode) {
    let settingsLayer = baseNode.querySelector('.redux-settings')
    if (settingsLayer) {
        return settingsLayer;
    }
    let reduxSettings = make({ el: 'section', class: 'redux-settings popOut' });
    let topButtonsContainer = make({ el: 'div', class: 'container buttons', appendTo: reduxSettings });
    let closeButton = make({ el: 'label', class: 'btn', appendTo: topButtonsContainer, text: 'close' });
    closeButton.addEventListener('click', function() {
        toggleVisibility(reduxSettings);
    })
    let settingsCard = make({ el: 'div', class: 'settings-card container', html: '<h1>Redux 設定</h1>', appendTo: reduxSettings });
    let outerGenSettingsContainer = make({ el: 'section', class: 'container', html: '<h2>主要設定</h2>', appendTo: settingsCard });
    let innerGenSettingsContainer = make({ el: 'div', class: 'settings container', appendTo: outerGenSettingsContainer })
    let outerStudentSettingsContainer = make({ el: 'section', class: 'container', html: '<h2>學生設定</h2>', appendTo: settingsCard });
    let innerStudentSettingsContainer = make({ el: 'div', class: 'settings container', appendTo: outerStudentSettingsContainer })
    let outerEmployeeSettingsContainer = make({ el: 'section', class: 'container', html: '<h2>教職員設定</h2>', appendTo: settingsCard });
    let innerEmployeeSettingsContainer = make({ el: 'div', class: 'settings container', appendTo: outerEmployeeSettingsContainer })

    appendSwitch(innerGenSettingsContainer, optionIds.STYLIZED_LOGIN, "啟用首頁美化", "套用新的首頁樣式");
    appendSwitch(innerGenSettingsContainer, optionIds.BUTTON_REPLACEMENT, "啟用按鈕替換", "將校務行政系統的所有按鈕替換為新的按鈕樣式");
    appendSwitch(innerGenSettingsContainer, optionIds.CUSTOM_EXPORTS, "啟用自訂報表輸出", "替報表系統產生自訂輸出選項，如 PDF, Excel (.xls), 純文字 (.txt) 等...")
    appendSwitch(innerGenSettingsContainer, optionIds.TABLE_EXPORT, "啟用表單圖檔下載", "於在白名單內的表格上新增「存成圖檔」的按鈕；方便用於課表下載")
    appendSwitch(innerStudentSettingsContainer, optionIds.GRADES_WIDGET, "啟用歷年成績小工具", "將上學期科目及成績插入於首頁中以便檢視");
    appendSwitch(innerStudentSettingsContainer, optionIds.ABSENCE_WIDGET, "啟用缺曠課小工具", "將本學期缺曠紀錄插入於首頁中以便檢視");
    appendSwitch(innerStudentSettingsContainer, optionIds.SURVEY_AUTOFILL, "新增期中期末評量自動填入", "於期中期末評量問卷中加入一次勾選「非常同意」...等按鈕")
    appendSwitch(innerStudentSettingsContainer, optionIds.CHECKIN_HELPER, "新增補打卡幫手", "新增常用時間、常用工作原因、常用補打卡原因按鈕於補打卡頁面")
    appendInput(innerStudentSettingsContainer, optionIds.WORK_DESCRIPTIONS, "工作內容快捷", "於聘雇打卡中快速加入以下工作內容")
    appendSwitch(innerEmployeeSettingsContainer, optionIds.CLASSROOM_AUTOFILL, '依教室類別自動填寫人數', "依教室類別自動填寫課程人數 (e.g. 五育樓大教室 = 60 人)。透過本插件自動填寫的欄位將以米白色呈現。");

    settingsCard.querySelectorAll('.settings-input[type="checkbox"]').forEach(input => {
        if (!input.id) {
            return;
        }
        let storedValue = GM_getValue(input.id, undefined);
        input.addEventListener('change', function(e) {
            GM_setValue(input.id, this.checked);
        });
        let isEnabled = storedValue === undefined ? true : storedValue;
        input.checked = isEnabled;
        GM_setValue(input.id, isEnabled);
    });
    baseNode.prepend(reduxSettings);
    componentHandler.upgradeElement(reduxSettings);
    return reduxSettings;
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

function isLoginPage(document) {
    return (document.querySelector('input[src$="Enter_M.png"]') ? true : false);
}

function isHomepage(document) {
    return (document.querySelector('body>form[action^="default.aspx"]') ? true : false);
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

function appendSettingsChip(parentNode, settingsId, settingsLabel, isCancelleable = false) {
    let chip = make({ el: 'span', class: 'mdl-chip mdl-chip--deletable', appendTo: parentNode, id: settingsId });
    make({ el: 'span', class: 'mdl-chip__text', text: settingsLabel, appendTo: chip });
    if (isCancelleable) {
        let cancelButton = make({ el: 'button', class: 'mdl-chip__action', html: `<i class="material-icons">cancel</i></button>`, appendTo: chip })
        cancelButton.addEventListener('click', x => {
            let existingValues = GM_getValue(settingsId, []);
            existingValues = existingValues.filter(item => item !== settingsLabel)
            GM_setValue(settingsId, existingValues);
            chip.remove();
        })
    }
}

function appendInput(parentNode, settingsId, settingsLabel, settingsDescription = undefined) {
    let settingsContainer = make({ el: 'div', class: 'individual-input', appendTo: parentNode });
    let topLabel = make({ el: 'label', appendTo: settingsContainer, text: settingsLabel })
    let outerLabel = make({ el: 'div', appendTo: settingsContainer, attr: { for: settingsId }, id: `${settingsId}-label`, class: 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label' });
    let innerInput = make({ el: 'input', attr: { type: 'text' }, id: settingsId, class: 'settings-input mdl-textfield__input', appendTo: outerLabel });
    innerInput.addEventListener('keyup', function(e) {
        if (event.key === "Enter") {
            let existingValues = GM_getValue(settingsId, []);
            existingValues.push(this.value);
            GM_setValue(settingsId, existingValues);
            appendSettingsChip(settingsContainer, settingsId, this.value, true);
            this.value = null;
        }
    });
    let innerLabel = make({ el: 'label', class: 'mdl-textfield__label', appendTo: outerLabel, text: settingsLabel });
    let chipContainer = make({ el: 'div', class: 'chips', id: settingsId, appendTo: settingsContainer })
    let chipsValue = GM_getValue(settingsId, []);
    chipsValue.forEach(x => {
        appendSettingsChip(chipContainer, settingsId, x, true);
    })
    if (settingsDescription) {
        make({ el: 'span', class: 'mdl-tooltip mdl-tooltip--large', appendTo: settingsContainer, text: settingsDescription, attr: { for: `${settingsId}-label` } });
    }
}

function appendSwitch(parentNode, settingsId, settingsLabel, settingsDescription = undefined) {
    let settingsContainer = make({ el: 'div', class: 'individual-settings', appendTo: parentNode });
    let outerLabel = make({ el: 'label', appendTo: settingsContainer, attr: { for: settingsId }, id: `${settingsId}-label`, class: 'mdl-switch mdl-js-switch mdl-js-ripple-effect' });
    let innerInput = make({ el: 'input', attr: { type: 'checkbox' }, id: settingsId, class: 'settings-input mdl-switch__input', appendTo: outerLabel });
    let innerLabel = make({ el: 'span', class: 'mdl-switch__label', appendTo: outerLabel, text: settingsLabel });
    if (settingsDescription) {
        make({ el: 'span', class: 'mdl-tooltip mdl-tooltip--large', appendTo: settingsContainer, text: settingsDescription, attr: { for: `${settingsId}-label` } });
    }
}

function cloneAttributes(element, sourceNode) {
    let attr;
    let attributes = Array.prototype.slice.call(sourceNode.attributes);
    while (attr = attributes.pop()) {
        element.setAttribute(attr.nodeName, attr.nodeValue);
    }
}

function _try(func, fallbackValue) {
    try {
        var value = func();
        return (value === null || value === undefined) ? fallbackValue : value;
    } catch (e) {
        return fallbackValue;
    }
}

function injectCustomCss(head){
    head.appendChild(make({el: 'style', html: `:root{--mod-fonts:"Segoe UI",'Helvetica Neue',Helvetica,Arial,"文泉驛正黑","WenQuanYi Zen Hei","儷黑 Pro","LiHei Pro","Microsoft YaHei UI","Microsoft JhengHei UI","標楷體",DFKai-SB,sans-serif;--main-color:#003e38}body,td.UnUse,.mdl-button,.mdl-snackbar,select{font-family:var(--mod-fonts);transition:font-size 0.25s cubic-bezier(.17,.67,.83,.67)}@media screen and (max-width:65em){#button-container input{min-width:50vw}.login-form{min-width:50vw;max-width:75vw}.login-form input[type="text"],.login-form input[type="password"],.login-form>#imgCaptcha{width:75%!important;padding:1em;margin:0.5em}.login-form>.mdl-button{width:75%;padding:1em}}iframe[name="MAIN"],iframe[name="MENU"]{min-width:0}iframe[name="MENU"]{flex:1}iframe[name="MAIN"]{flex:4}.redux-patched-body{display:flex}#AgreeClaim,#AgreeRule{overflow:scroll}.redux-settings{display:flex;align-items:center;justify-content:center;background:#000;width:100vw;height:100vh;position:absolute;top:0}.redux-settings>.buttons{position:absolute;top:0;right:0}.individual-input{display:flex;flex-direction:column;align-items:flex-start}.individual-input>label{font-size:16px;line-height:24px}.settings-card{height:80vh;width:80vw;position:fixed;top:0;display:flex;justify-content:center;z-index:1000;color:#fff;flex-direction:column}.settings-card *:not(.material-icons){font-family:var(--mod-fonts)}.settings.container{display:grid;row-gap:2em;grid-template-columns:1fr 1fr 1fr}#login-container{display:flex;flex-direction:column;justify-content:center;align-items:center}.login-form{display:flex;flex-direction:column;align-items:center;background:#353535b5;padding:2em;min-width:25vw;max-width:50vw;border:#59595991 2px solid;border-radius:15px;color:#eee}.overlay{background:#141827;position:absolute;min-height:100vh;overflow:hidden;top:0;left:0;z-index:-1;width:100vw}#overlay-wave{left:0;top:0;transform:rotate(80deg);position:absolute}#overlay-wave>.wave{animation:drift 7000ms infinite linear;background:#e80c69;border-radius:45%;height:calc(100vw*0.85);margin-left:-150px;margin-top:-250px;opacity:.4;transform-origin:50% 48%;width:100vw}#overlay-wave>.wave.-two{animation:drift 3000ms infinite linear;background:#000;opacity:.1;position:fixed}#overlay-wave>.wave.-three{animation:drift 7500ms infinite linear;background-color:#ff77ca;position:fixed}#overlay-wave:after{content:'';display:block;height:100%;left:0;top:0;transform:translate3d(0,0,0);width:100%;z-index:11}@keyframes drift{from{transform:rotate(0deg)}from{transform:rotate(360deg)}}#button-container input{transition:0.25s ease-in-out}#button-container>.container{margin:0.5em}#button-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));grid-gap:1em;padding-bottom:4em;max-width:60vw;transition:0.25s cubic-bezier(.17,.67,.83,.67)}#nptu-redux-header{height:15vh;display:flex;justify-content:center;align-items:center;padding:2em 0}#nptu-redux-header>.header-text{font-size:3em;text-decoration:none;color:#eee;line-height:1.25em;text-align:center}.text.clickable,.copyable{font-size:1em;text-decoration:none;transition:text-shadow .3s,text-decoration .3s,font-size .4s;font-weight:bold}.text.clickable:hover,.copyable:hover{font-size:1.2em;vertical-align:top;text-decoration:underline;text-shadow:1px 1px 1px rgba(0,0,0,0.35);cursor:pointer}.top.header.container>.sub.container{display:flex;justify-content:center}.top.header.container>.sub.container:nth-child(odd){align-items:flex-start}.top.header.container>.sub.container:nth-child(even){align-items:flex-end}.top.header.container>.sub.container>div{display:inline-flex;align-items:center;justify-content:center}.top.header.container>.sub.container>div:nth-child(odd){margin-bottom:0.25em}.top.header.container>.buttons>.btn:nth-last-of-type(n+2){margin-right:0.25em}.top.header.container>.buttons>.btn{box-shadow:0 3px 1px -2px rgba(0,0,0,.2),0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12);background:#005669;border-radius:10px;padding:5px;max-height:1em;max-width:1em}.top.header.container>.buttons>.btn.hoverable{transition:transform .25s}.top.header.container>.buttons>.btn.hoverable:hover{transform:scale(1.05)}.btn{font:3em "Material Icons",sans-serif;cursor:pointer;background:none;border:none;color:#fff}.export-link,.export-link:hover,.export-link:active,.export-link:focus,.export-link:focus-within{text-decoration:none}.container:not(.top){margin:.5em}.header.container{display:flex;background-color:var(--main-color);color:#fff;font-size:1.35em;padding:.5em;-webkit-box-shadow:0 2px 2px 0 rgba(0,0,0,0.14),0 3px 1px -2px rgba(0,0,0,0.12),0 1px 5px 0 rgba(0,0,0,0.2);box-shadow:0 2px 2px 0 rgba(0,0,0,0.14),0 3px 1px -2px rgba(0,0,0,0.12),0 1px 5px 0 rgba(0,0,0,0.2)}.header.container:nth-of-type(2n):not(.top){background-color:#b71c1c}.header.container:nth-of-type(3n):not(.top){background-color:#154648}.main.container{margin:1em;display:flex;flex-direction:row;flex-wrap:wrap}.sub.container{flex-direction:column;flex:2.5}.menu.container{display:flex;flex-direction:column}.menu.container,.alt.container{flex:1}.alt.buttons.container.right{display:flex;justify-content:flex-end}.alt.buttons.container.left{display:flex;justify-content:flex-start}.print.container{display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:center}.help .text.container{border:solid 1px var(--main-color)}.text.container{white-space:pre-wrap;padding:1em;border-radius:6px;margin:0 1em}.inline-frame{border:none}.tbl-btn{display:block}tr.TRHeaderStyle{font-family:var(--mod-fonts);background:var(--main-color)!important}td.TDItemStyle{font-family:var(--mod-fonts);min-width:3em}.title-with-icon.left{margin-left:.5em}.title-with-icon.right{margin-right:.5em}.class-option{cursor:pointer}#overlay-spinner{width:12em;height:12em}#redux-overlay-container{position:sticky;top:0;left:0;z-index:999}.redux-overlay{background:#000;height:100vh;width:100vw;justify-content:center;align-items:center;flex-direction:column;display:flex}.redux-overlay>.text{color:#fff;padding:1em 0;font-size:24pt}.popIn{opacity:0.8!important;pointer-events:auto!important}.popOut{opacity:0!important;pointer-events:none!important}.quick-selection{display:grid;grid:auto-flow dense/repeat(3,auto)}`}))
}
