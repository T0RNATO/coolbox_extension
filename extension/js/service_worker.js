chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Ensure that only this extension can interact with this service worker
    if (sender.id === chrome.runtime.id) {
        switch(request) {
            // Getting schoolbox session id
            case "getCookie":
                // Return the token
                chrome.cookies.get({"url": "https://schoolbox.donvale.vic.edu.au/", "name": "PHPSESSID"}, (cookies) => {
                    sendResponse(cookies);
                });
                return true;

            // Creating notification timers
            case "createAlarms":
                createAlarms();
                break;
            // Call schoolbox scripts after page reconstruction
            case "pageLoaded":
                chrome.scripting.executeScript({
                    files: [
                        "js/pageStart/reminders.js",
                        "js/pageStart/schoolbox.js",
                        "js/pageStart/rgbTiles.js"
                    ],
                    target: {
                        tabId: sender.tab.id
                    }
                })
                break;
            case "enableDarkMode":
                chrome.scripting.insertCSS({
                    files: ["css/darkmode.css"],
                    target: {
                        tabId: sender.tab.id
                    }
                })
                break;
            case "disableDarkMode":
                chrome.scripting.removeCSS({
                    files: ["css/darkmode.css"],
                    target: {
                        tabId: sender.tab.id
                    }
                })
                break;
            case "uninstall":
                chrome.management.uninstallSelf();
        }
    }  
});

// Essentially a setInterval for checking for notifications
chrome.alarms.create("cb-notification-loop", {periodInMinutes: 15, delayInMinutes: 0})

chrome.alarms.onAlarm.addListener((alarm) => {
    console.info(alarm);
    // If it's just the notif loop, delete all alarms and recreate them (in case the user has updated them)
    if (alarm.name === "cb-notification-loop") {
        createAlarms();

    // If it's an actual notification, send a desktop notification
    } else if (alarm.name.startsWith("cba-")) {
        let reminder = JSON.parse(alarm.name.split("-")[1])
        console.debug("Alarm Triggered", reminder);

        const options = {
            buttons: [
                {title: "View on Schoolbox"}
            ],
            iconUrl: "/icon.png",
            title: reminder.title,
            requireInteraction: true,
            message: "You have a notification for " + reminder.title,
            type: "basic",
            priority: 2
        }

        // (Firefox doesn't support a bunch of stuff)
        if (chrome.runtime.getURL('').startsWith('moz-extension://')) {
            delete options.buttons;
            delete options.requireInteraction;
        }
        
        chrome.notifications.create(JSON.stringify(reminder), options)
    }
})

function goToSchoolbox(alarm) {
    let reminder = JSON.parse(alarm)
    if (reminder.assessment) {
        chrome.tabs.create({
            url: "https://schoolbox.donvale.vic.edu.au/learning/assessments/" + reminder.assessment
        })
    } else {
        chrome.tabs.create({
            url: "https://schoolbox.donvale.vic.edu.au/"
        })
    }
}

chrome.notifications.onButtonClicked.addListener((alarm) => {goToSchoolbox(alarm)})
chrome.notifications.onClicked.addListener((alarm) => {goToSchoolbox(alarm)})

function fetchReminders(callback) {
    chrome.cookies.get({"url": "https://schoolbox.donvale.vic.edu.au/", "name": "PHPSESSID"}, (cookies) => {
        // Fetch all reminders
        fetch("https://api.coolbox.lol/reminders", {method: "GET", headers: new Headers({
            "Authorization": "Bearer " + cookies.value
        })}).then(response => {response.json().then(reminders => {
            callback(reminders, response);
        })})
    });
}

function createAlarms() {
    fetchReminders((reminders, response) => {
        if (response.ok && response.status === 200) {
            // Remove all the alarms to remake them in case reminders have been deleted/edited
            chrome.alarms.clearAll();
            
            for (const rem of reminders) {
                // If the reminder needs a desktop notification, create it in case we lose access to the token before next loop
                if (rem.method === "desktop" || rem.method === "both") {
                    chrome.alarms.create("cba-" + JSON.stringify(rem), {when: rem.due});
                }
            }
        } else {
            console.warn("Cannot sync reminders, no token (Error " + response.status + ")");
        }
    })
}