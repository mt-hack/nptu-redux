// ==UserScript==
// @name NPTU Web Panel QOL Improvements
// @author Still Hsu
// @match http://webap.nptu.edu.tw/Web/Message/default.aspx
// @grant none
// ==/UserScript==

let main = document.getElementsByName("MAIN")[0];

main.onload = function () {
    fontFix();
    tableFix();
    printFix();
}

// Prioritize MSFT fonts over unknown fonts shipped from the website.
function fontFix() {
    let contentHead = main.contentDocument.head;
    let css = document.createElement("style");
    css.innerText = "body {font-family: 'Microsoft YaHei', 'Microsoft JhengHei', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;}";
    contentHead.insertAdjacentElement('beforeend', css);
};

// Fix A0432S broken implementation of tables
function tableFix() {
    let contentBody = main.contentDocument.body;
    if (contentBody.querySelector('form').name === "A0432SPage") {
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
            tds[5].style = "position: sticky; left: 0; background: #FEECE6";
        })
        trs[0].style.backgroundImage = "url(../Images/Common/TdBack.png);";

        var oldTableHeader = contentBody.querySelector("[id$=dgDataCopy] tbody");
        oldTableHeader.remove();
        var newTableHeader = document.createElement("thead");
        newTableHeader.innerHTML = oldTableHeader.innerHTML;
        var tableContent = contentBody.querySelector("[id$=dgData]");
        tableContent.prepend(newTableHeader);
        tableContent.parentNode.style.width = "40%";
        tableContent.parentNode.parentNode.style.background = null;
    }
};

// Add export options for spreadsheet printing
function printFix() {
    let contentBody = main.contentDocument.body;
    let printButtons = contentBody.querySelectorAll("form a[id*='Print']");
    if (printButtons !== null && printButtons.length > 0) {
        printButtons.forEach(printButton => {
            // create outer div for export options
            let pbParent = printButton.parentElement;
            let exportDiv = document.createElement("div");
            exportDiv.className = "export-section";
            exportDiv.style = "margin: 0 20px 0 0; padding: 10px 0px 10px 0;";

            // create export label
            let exportLabel = document.createElement("label");
            exportLabel.for = "export-option";
            exportLabel.innerText = "匯出選項："

            // prepare export menu
            let exportMenu = document.createElement("select");
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
            // hook printing button update
            exportMenu.onchange = updatePrint;

            function updatePrint() {
                let url = new URL(printButton.href);
                url.searchParams.set("init", exportMenu.value);
                printButton.href = url;
            };

            exportDiv.appendChild(exportLabel);
            exportDiv.appendChild(exportMenu);

            // inject menu
            pbParent.insertAdjacentElement('afterbegin', exportDiv);
            // update button on load
            updatePrint();
        });
    }
};