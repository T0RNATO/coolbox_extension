// Get the schoolbox login cookie to authenticate with coolbox
let cookie, headers, currentReminders, discordAuthenticated;
chrome.runtime.sendMessage("getCookie", (cook) => {
    cookie = cook.value;

    headers = new Headers({
        "Authorization": "Bearer " + cookie,
        "Content-Type": "application/json"
    })

    apiGet("reminders", (reminders) => {
        currentReminders = reminders;
        console.log(reminders);
        for (const reminder of reminders) {
            if (reminder.assessment) {
                const buttonElement = document.querySelector(`a[href*='${reminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
                buttonElement.innerText = "notifications_active";
                buttonElement.dataset.reminder = JSON.stringify(reminder);
            }
        }
    })

    document.querySelector("#auth").href = "https://api.coolbox.lol/discord/redirect?state=" + cookie;

    apiGet("user", (data) => {
        discordAuthenticated = data.discord.linked;
    })

    apiGet("stats/message", (message) => {
        if (message.message !== null) {
            const urgentMessage = document.createElement("span");
            urgentMessage.innerText = message.message;
            urgentMessage.classList.add("message");
            document.querySelector("#content > .row:first-of-type").appendChild(urgentMessage);
        }
    })
})

let editFromViewPopup = false;

function updateAlarms() {
    chrome.runtime.sendMessage("createAlarms");
}

const createReminderPopup = document.createElement("div");
createReminderPopup.classList.add("popup");
createReminderPopup.innerHTML = /*html*/`
    <div class="popup-title">
        <h1 id="create-title"><strong>Create Reminder</strong></h1>
        <h1 id="edit-title"><strong>Edit Reminder</strong></h1>
    </div>
    <div class="popup-body">
        Name:
        <input placeholder="Reminder Name" id="rem-name" maxlength="128">
        Time:
        <input placeholder="Time" id="rem-time">
        Notification Method:<br>
        <input type="radio" id="system" value="desktop" class="plain popup-radio" name="notif-method">
        <label for="system" class="popup-label button">System Notification</label>

        <input type="radio" id="discord" value="discord" class="plain popup-radio" name="notif-method">
        <label for="discord" class="popup-label button">Discord Ping</label>

        <input type="radio" id="both" value="both" class="plain popup-radio" name="notif-method">
        <label for="both" class="popup-label button">Both</label>

        <span id="discord-warning" class="notif-warning">You must <a id="auth">authenticate</a> to get notified on Discord.</span>
        <span id="sys-warning" class="notif-warning">Note: Requires system notifications to be enabled for your browser.</span>

        <div class="popup-buttons" id="create-buttons">
            <button class="popup-button" id="cancel-popup">Cancel</button>
            <button class="submit popup-button" id="create-reminder">Create Reminder</button>
        </div>
        <div class="popup-buttons hide" id="edit-buttons">
            <button class="submit popup-button" id="delete-reminder">Delete Reminder</button>
            <button class="popup-button" id="save-reminder">Save Reminder</button>
        </div>
    </div>
`;

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

createReminderPopup.querySelectorAll("input[name='notif-method']").forEach(input => {
    input.addEventListener("click", (event) => {updateWarnings(event.target.value)});
})

const viewRemindersPopup = document.createElement("div");
viewRemindersPopup.classList.add("popupView");
viewRemindersPopup.innerHTML = /*html*/`
    <div class="popup-title">
        <h1><strong>Reminders</strong></h1>
    </div>
    <div class="popup-body" id="view-rem-container">
        Loading...
    </div>
`

const reminderButtons = document.createElement("li");
reminderButtons.innerHTML = /*html*/`
    <div class="card small-12 rem-add-container">
        <div class="button rem-button" id="add-rem">
            <span class="material-symbols-outlined align">add</span>
            Add Reminder
        </div>
        <div class="button rem-button" id="view-rems">
            <span class="material-symbols-outlined align">visibility</span>
            View All Reminders
        </div>
    </div>
`

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

document.querySelector("#component52396 ul").appendChild(reminderButtons);

const timeFormat = "l F J Y h:iK"

let openReminder = null;

document.body.appendChild(createReminderPopup);
document.body.appendChild(viewRemindersPopup);
createReminderPopup.addEventListener("click", (e) => {e.stopPropagation()});
viewRemindersPopup.addEventListener("click", (e) => {e.stopPropagation()});

function getAssessmentId(link) {
    const sections = link.split("/");
    return Number(sections[sections.length - 2]);
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

for (const dueWorkItem of document.querySelectorAll("#component52396 li:not(:last-child) .card")) {
    const reminderButton = document.createElement("div");
    reminderButton.classList.add("reminder-button", "material-symbols-outlined");

    reminderButton.innerText = `notification_add`;

    reminderButton.addEventListener("click", (ev) => {dueWorkItemButtonClick(ev)})
    dueWorkItem.appendChild(reminderButton);
}

function closePopup() {
    document.querySelector(".popup").classList.remove("display");
    document.querySelector(".popupView").classList.remove("display");
    createReminderPopup.querySelector("#rem-name").value = "";
    openReminder = null;
}
let timePicker;

// Initialise the calendar
window.onload = () => {
    timePicker = flatpickr("#rem-time", {dateFormat: timeFormat, enableTime: true, minDate: new Date(), allowInput: true});
    timePicker.calendarContainer.addEventListener("click", (ev) => {
        ev.stopPropagation();
    })
}

document.querySelector("#cancel-popup").addEventListener("click", closePopup);

document.querySelector("#create-reminder").addEventListener("click", () => {
    const data = getPopupData();

    sendData("POST", data).then((response) => {
        if (response.ok && response.status === 200) {
            response.json().then((reminder) => {
                if (reminder.assessment) {
                    const buttonElement = document.querySelector(`a[href*='${reminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
                    buttonElement.dataset.reminder = JSON.stringify(reminder);
                    buttonElement.innerText = "notifications_active";
                }
                updateAlarms();
            })
        } else {
            alert("Reminder Creation Failed")
        }
        closePopup();
    })
});

document.querySelector("#save-reminder").addEventListener("click", () => {
    const data = getPopupData();

    sendData("PATCH", data).then((response) => {
        if (response.ok && response.status === 200) {
            response.json().then((reminder) => {
                if (reminder.assessment) {
                    const buttonElement = document.querySelector(`a[href*='${openReminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
                    buttonElement.dataset.reminder = JSON.stringify(reminder);
                }
                closePopup();
                updateAlarms();
                if (editFromViewPopup) {
                    editFromViewPopup = false;
                    viewRemindersPopup.classList.add("display");
                    updateViewRemindersPopup();
                }
            })
        } else {
            alert("Reminder Editing Failed");
            closePopup();
        }
    })
});

document.querySelector("#delete-reminder").addEventListener("click", () => {
    deleteReminder(openReminder, () => {
        closePopup();
    })
});

document.querySelector("#view-rems").addEventListener("click", (ev) => {
    ev.stopPropagation();
    closePopup();
    viewRemindersPopup.classList.add("display");
    updateViewRemindersPopup();
})

document.querySelector("#add-rem").addEventListener("click", (ev) => {
    ev.stopPropagation();
    closePopup();
    openReminderEditPopup({
        due: Date.now(),
        assessment: null,
        title: "New Reminder",
        method: "desktop"
    }, "create");
})

function deleteReminder(reminder, then) {
    sendData("DELETE", {id: reminder.id}).then((response) => {
        if (response.ok && response.status === 200) {
            updateAlarms();
            if (reminder.assessment) {
                const buttonElement = document.querySelector(`a[href*='${reminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
                delete buttonElement.dataset.reminder;
                buttonElement.innerText = "notification_add";
            }
        } else {
            alert("Reminder Deletion Failed")
        }
        then();
    })
}

function sendData(method, body) {
    return fetch("https://api.coolbox.lol/reminders", {
        method: method,
        body: JSON.stringify(body),
        headers: headers
    })
}

function apiGet(path, callback) {
    fetch("https://api.coolbox.lol/" + path, {
        method: "GET",
        headers: headers
    }).then(response => {response.json().then(data => {
        callback(data, response);
    })})
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

document.body.addEventListener("click", closePopup);

document.head.innerHTML += /*html*/`
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
`