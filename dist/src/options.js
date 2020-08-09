const ENTER_KEY_CODE = 13;
// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', () => {
    drawFilterListTable();
    drawIntentListTable();
    setAddButtonListener();
    restoreSavedOptions();
    drawWeeklyStatsGraph();
    // options listeners
    setupOptionsListener();
});
function setupOptionsListener() {
    document.getElementById('save').addEventListener('click', saveCurrentOptions);
}
function saveCurrentOptions() {
    // get all form values
    const whitelistTimeElement = document.getElementById('whitelistTime');
    const whitelistTime = whitelistTimeElement.value;
    const numIntentEntriesElement = document.getElementById('numIntentEntries');
    const numIntentEntries = numIntentEntriesElement.value;
    chrome.storage.sync.set({ 'numIntentEntries': numIntentEntries }, () => {
        chrome.storage.sync.set({ 'whitelistTime': whitelistTime }, () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('statusContent');
            status.textContent = 'options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 1500);
        });
    });
}
function restoreSavedOptions() {
    chrome.storage.sync.get(null, (storage) => {
        document.getElementById('whitelistTime').value = storage.whitelistTime;
        document.getElementById('numIntentEntries').value = storage.numIntentEntries;
    });
}
function updateButtonListeners() {
    // get all buttons
    const buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
        button.addEventListener("click", () => {
            var _a;
            // get button ID
            const id = parseInt(button.id[0]);
            // get url
            const url = (_a = document.getElementById(button.id[0] + "site")) === null || _a === void 0 ? void 0 : _a.innerHTML;
            // get blockedSites
            chrome.storage.sync.get(null, (storage) => {
                const blockedSites = storage.blockedSites;
                // remove by ID
                blockedSites.splice(id, 1);
                // sync with chrome storage
                chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
                    console.log(`removed ${url} from blocked list`);
                    drawFilterListTable();
                });
            });
        });
    }
    ;
}
;
function generateWebsiteDiv(id, site) {
    return "<tr>" +
        `<td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td>` +
        `<td style="width: 5%"><button id=${id}>&times;</button></td>` +
        "</tr>";
}
function generateIntentDiv(id, intent, date, url) {
    // reformatting date to only include month, date, and 12 hour time
    const formattedDate = date.toLocaleDateString('default', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    // creating display table for intents and dates
    return "<tr>" +
        `<td style="width: 40%"><p class="intentDisplay" id=${id}>${url}</p></td>` +
        `<td style="width: 40%"><p class="intentDisplay" id=${id}>${intent}</p></td>` +
        `<td style="width: 20%"><p class="intentDisplay" id=${id}>${formattedDate}</p></td>` +
        "</tr>";
}
function drawFilterListTable() {
    // accessing chrome storage for blocked sites
    chrome.storage.sync.get(null, (storage) => {
        //fetch blocked sites
        const blockedSites = storage.blockedSites;
        // generating table
        let table = '<table class="hover shadow styled">';
        let cur_id = 0;
        // appending row for each addiitonal blocked site
        blockedSites.forEach((site) => {
            table += generateWebsiteDiv(cur_id, site);
            cur_id++;
        });
        // generates new line in table for new intent
        table += "</table>";
        // adds table to html
        const filterList = document.getElementById('filterList');
        if (filterList != null) {
            filterList.innerHTML = table;
        }
        // adding listener to "x"
        updateButtonListeners();
    });
}
;
function drawIntentListTable() {
    // accessing chrome storage for intents
    chrome.storage.sync.get(null, (storage) => {
        // fetch intent list
        const intentList = storage.intentList;
        // generate table element
        let table = '<table class="hover styled">' +
            "<tr>" +
            '<th style="width: 40%">url</th>' +
            '<th style="width: 40%">intent</th>' +
            '<th style="width: 20%">date</th>' +
            "</tr>";
        let cur_id = 0;
        // iter dates in intentList
        for (const rawDate in intentList) {
            // if number of entries is less than max
            if (cur_id < storage.numIntentEntries) {
                // parse fields from intentlist[rawDate]
                const date = new Date(rawDate);
                const intent = intentList[rawDate]['intent'];
                const url = intentList[rawDate]['url'];
                // append table row with this info
                table += generateIntentDiv(cur_id, intent, date, url);
                cur_id++;
            }
        }
        // generates new line in table for new intent
        table += "</table>";
        // insert table into html
        const previousIntents = document.getElementById('previousIntents');
        if (previousIntents != null) {
            previousIntents.innerHTML = table;
        }
    });
}
;
// sets event listeners for add new url operations
function setAddButtonListener() {
    const urlInputElement = document.getElementById('urlInput');
    // add key listener to submit new url on <ENTER> pressed
    urlInputElement.addEventListener("keypress", (event) => {
        if (event.keyCode == ENTER_KEY_CODE) {
            addUrlToFilterList();
        }
    });
    // add click listener to add URL button
    const addButton = document.getElementById('add');
    addButton.addEventListener('click', () => {
        addUrlToFilterList();
    });
}
;
function addUrlToFilterList() {
    // get urlInput
    const urlInput = document.getElementById('urlInput');
    // see if value is non-empty
    if (urlInput.value != "") {
        chrome.storage.sync.get(null, (storage) => {
            // get current blocked sites
            const blockedSites = storage.blockedSites;
            // add to blocked sites
            blockedSites.push(urlInput.value);
            // sync changes with chrome storage
            chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
                console.log(`added ${urlInput} from blocked list`);
                // clear input
                urlInput.value = "";
                // redraw filterList
                drawFilterListTable();
            });
        });
    }
}
;
class PercentageStats {
    constructor(DayStats) {
        this.totalStats = (DayStats.visited + DayStats.blocked + DayStats.passed) / 100;
        this.visitedPercent = DayStats.visited / this.totalStats;
        this.blockedPercent = DayStats.blocked / this.totalStats;
        this.passedPercent = DayStats.passed / this.totalStats;
        this.dateString = DayStats.dateString;
    }
    getDateString() {
        return ((this.dateString).toLowerCase()) + '.';
    }
}
function generateBarGraphBar(p) {
    if (isNaN(p.visitedPercent)) {
        return "";
    }
    return `<div class="bar" style="height:${p.totalStats * 100 * 4}px">` +
        `<div class="visited" style="flex-basis:${p.visitedPercent}%"></div>` +
        `<div class="passed" style="flex-basis:${p.passedPercent}%"></div>` +
        `<div class="blocked" style="flex-basis:${p.blockedPercent}%"></div>` +
        `</div>`;
}
function generateBarGraphDate(p) {
    if (isNaN(p.visitedPercent)) {
        return "";
    }
    return `<div class="date">` +
        `<p class="day"> ${p.getDateString()} </p>` +
        `</div>`;
}
function drawWeeklyStatsGraph() {
    // accessing chrome storage for blocked sites
    chrome.storage.sync.get(null, (storage) => {
        //fetch weekly stats
        const weeklyStats = storage.pastSevenDays;
        let barDiv = '<div id="graph" class="barGraphComponent">';
        let labelDiv = '<div id="label" class="barGraphComponent">';
        weeklyStats.dayStats.forEach((DayStats) => {
            const dailyPercents = new PercentageStats(DayStats);
            barDiv += generateBarGraphBar(dailyPercents);
            labelDiv += generateBarGraphDate(dailyPercents);
        });
        barDiv += "</div>";
        labelDiv += "</div>";
        console.log(`This is the barDiv: ${barDiv}`);
        console.log(`This is the labelDiv: ${labelDiv}`);
        // adds additional div to html
        const graphBar = document.getElementById("weeklyGraph");
        graphBar.innerHTML += barDiv + labelDiv;
    });
}
;
