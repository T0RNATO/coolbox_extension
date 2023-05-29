const range = n => [...Array(n).keys()]
const timeFormat = "l F J Y h:iK"

let currentReminders;
let editFromViewPopup = false;
let openReminder = null;

function updateAlarms() {
    chrome.runtime.sendMessage("createAlarms");
}

function updateWarnings(clicked) {
    createReminderPopup.querySelector("#discord-warning").classList.remove("display");
    createReminderPopup.querySelector("#sys-warning").classList.remove("display");

    if ((clicked === "discord" || clicked === "both") && !discordAuthenticated) {
        createReminderPopup.querySelector("#discord-warning").classList.add("display");
    }

    if (clicked === "desktop" || clicked === "both") {
        createReminderPopup.querySelector("#sys-warning").classList.add("display");
    }
}

function updateViewRemindersPopup() {
    apiGet("reminders", (reminders) => {
        currentReminders = reminders;

        const container = viewRemindersPopup.querySelector("#view-rem-container");
        container.innerHTML = "";
        for (const [i, reminder] of Object.entries(reminders)) {
            const rem = document.createElement("div");
            rem.classList.add("rem-display");
            rem.dataset["id"] = i;

            rem.innerHTML = /*html*/`
                <strong>${reminder.title}</strong> (Ping on ${reminder.method})<br>
                ${flatpickr.formatDate(new Date(reminder.due), timeFormat)}
                <div class="rem-view-edit">
                    <span class="material-symbols-outlined rem-view-button rem-view-edit-b">edit</span>
                </div>
            `

            container.appendChild(rem);
            
            rem.querySelector(".rem-view-edit-b").addEventListener("click", (ev) => {
                const re = currentReminders[ev.target.parentElement.parentElement.dataset.id];
                closePopup();
                editFromViewPopup = true;
                openReminderEditPopup(re, "edit");
            })
        }
        if (reminders.length === 0) {
            container.innerHTML = "You have no reminders";
        }
    })
}

function getAssessmentId(link) {
    const sections = link.split("/");
    return Number(sections[sections.length - 2]);
}

function deleteReminder(reminder, callback) {
    apiSend("DELETE", {id: reminder.id}, "reminders", (data) => {
        updateAlarms();
        if (reminder.assessment) {
            const buttonElement = document.querySelector(`a[href*='${reminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
            delete buttonElement.dataset.reminder;
            buttonElement.innerText = "notification_add";
        }
        if (callback) {
            callback();
        }
    }, (response) => {
        alert("Reminder deletion failed.");
        console.error("Reminder deletion failed with response code " + response.status);
    })
}

function apiError(response, error, errorCallback) {
    console.error(`Failed to access https://api.coolbox.lol/${path}, with code ${response.status}.`);
    console.error(error);
    if (errorCallback) {
        errorCallback(response, error)
    }
}

function apiSend(method, body, path, callback, errorCallback) {
    fetch("https://api.coolbox.lol/" + path, {
        method: method,
        body: JSON.stringify(body),
        headers: headers
    }).then(response => {response.json().then(data => {
        if (response.status === 200) {
            if (callback) {
                callback(data, response);
            } else {
                apiError(response, error, errorCallback);
            }
        }
    })}).catch((error) => {
        apiError(response, error, errorCallback);
    })
}

function apiGet(path, callback, errorCallback) {
    fetch("https://api.coolbox.lol/" + path, {
        method: "GET",
        headers: headers
    }).then(response => {response.json().then(data => {
        if (response.status === 200) {
            callback(data, response);
        } else {
            apiError(response, error, errorCallback);
        }
    })}).catch((error) => {
    apiError(response, error, errorCallback);
    })
}

function getPopupData() {
    const title = document.querySelector("#rem-name").value;
    const time = timePicker.selectedDates[0].getTime();
    if (document.querySelector(".popup-radio:checked") === null) {
        return alert("Select Notification Method");
    }
    if (title === "") {
        return alert("Enter a Title");
    }
    const method = document.querySelector(".popup-radio:checked").value;   

    const data = {
        title: title,
        due: time,
        method: method,
        assessment: openReminder.assessment
    }

    if (openReminder.id) {
        data.id = openReminder.id;
    }

    return data;
}

/**
 * @param {Object} reminder
 * @param {Number} reminder.id
 * @param {Number|String} reminder.due
 * @param {Number} reminder.assessment
 * @param {String} reminder.title
 * @param {String} reminder.method
 * 
 * @param {String} type - The type of the popup - "create" or "edit"
*/
function openReminderEditPopup(reminder, type) {
    // Save the open reminder
    openReminder = reminder;

    document.querySelector("#create-buttons").classList.add("hide");
    document.querySelector("#edit-buttons").classList.add("hide");
    
    document.querySelector(`#${type}-buttons`).classList.remove("hide");

    document.querySelector("#create-title").classList.add("hide");
    document.querySelector("#edit-title").classList.add("hide");
    
    document.querySelector(`#${type}-title`).classList.remove("hide");

    // Add default
    if (!reminder.method) {
        reminder.method = "desktop";
    }

    // Set default input values
    createReminderPopup.querySelector("#rem-name").value = reminder.title;
    createReminderPopup.querySelector(`input[value=${reminder.method}]`).checked = true;
    updateWarnings(reminder.method);

    // Automatically select the time of the due work item
    if (typeof reminder.due === "string") {
        timePicker.setDate(reminder.due.replace("am", "AM").replace("fm", "FM"), false, timeFormat);
    } else {
        timePicker.setDate(reminder.due)
    }
    createReminderPopup.classList.add("display");
}

function closePopup() {
    document.querySelector(".popup").classList.remove("display");
    document.querySelector(".popupView").classList.remove("display");
    createReminderPopup.querySelector("#rem-name").value = "";
    openReminder = null;
}

function dueWorkItemButtonClick(ev) {
    ev.stopPropagation();
    closePopup();
    const button = ev.target;
    if (button.dataset.reminder) {
        openReminderEditPopup(JSON.parse(button.dataset.reminder), "edit");
    } else {
        openReminderEditPopup({
            id: null,
            title: button.parentElement.querySelector("h3").innerText,
            method: null,
            due: button.parentElement.querySelector("[title*=' ']").title,
            assessment: getAssessmentId(button.parentElement.querySelector("a").href)
        }, "create");
    }
}