// Get the schoolbox login cookie to authenticate with coolbox
let cookie, headers;
chrome.runtime.sendMessage(null, (cook) => {
    cookie = cook.value;
    fetch("https://api.coolbox.lol/reminders", {method: "GET", headers: new Headers({
        "Authorization": "Bearer " + cookie
    })}).then(response => {response.json().then(reminders => {
        console.log(reminders);
        for (const reminder of reminders) {
            if (reminder.assessment) {
                const buttonElement = document.querySelector(`a[href*='${reminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
                buttonElement.innerText = "notifications_active";
                buttonElement.dataset.reminder = JSON.stringify(reminder);
            }
        }
        headers = new Headers({
            "Authorization": "Bearer " + cookie,
            "Content-Type": "application/json"
        })
    })})
})

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

        <br><br>
        <span title="Ticking this will show the reminder as an assessment-specific reminder rather than a generic reminder">Associate with Asssessment:</span>
        <input type="checkbox" id="link-assessment" class="plain">
        <div class="popup-buttons" id="create-buttons">
            <button class="submit popup-button" id="create-reminder">Create Reminder</button>
            <button class="popup-button" id="cancel-popup">Cancel</button>
        </div>
        <div class="popup-buttons hide" id="edit-buttons">
            <button class="submit popup-button" id="delete-reminder">Delete Reminder</button>
            <button class="popup-button" id="save-reminder">Save Reminder</button>
        </div>
    </div>
`

const viewRemindersPopup = document.createElement("div");
viewRemindersPopup.classList.add("popupView");
viewRemindersPopup.innerHTML = /*html*/`
    <div class="popup-title">
        <h1><strong>Reminders</strong></h1>
    </div>
    <div class="popup-body">
        
    </div>
`

const reminderButtons = document.createElement("li");
reminderButtons.innerHTML = /*html*/`
    <div class="card small-12 rem-add-container">
        <div class="button rem-button">
            <span class="material-symbols-outlined">add</span>
            Add Reminder
        </div>
        <div class="button rem-button">
            <span class="material-symbols-outlined">visibility</span>
            View All Reminders
        </div>
    </div>
`

document.querySelector("#component52396 ul").appendChild(reminderButtons);

const timeFormat = "l F J Y h:iK"

let openReminder = null;

document.body.appendChild(createReminderPopup);
createReminderPopup.addEventListener("click", (e) => {e.stopPropagation()});

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
function openPopup(reminder, type) {
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
    createReminderPopup.querySelector("#link-assessment").checked = Boolean(reminder.assessment);
    createReminderPopup.querySelector(`input[value=${reminder.method}]`).checked = true;


    // Automatically select the time of the due work item
    if (typeof reminder.due === "string") {
        timePicker.setDate(reminder.due.replace("am", "AM").replace("fm", "FM"), false, timeFormat);
    } else {
        timePicker.setDate(reminder.due)
    }
    createReminderPopup.classList.add("display");
}

for (const dueWorkItem of document.querySelectorAll("#component52396 li:not(:last-child) .card")) {
    const reminderButton = document.createElement("div");
    reminderButton.classList.add("reminder-button", "material-symbols-outlined");

    reminderButton.innerText = `notification_add`;

    reminderButton.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const button = ev.target;
        if (button.dataset.reminder) {
            openPopup(JSON.parse(button.dataset.reminder), "edit");
        } else {
            openPopup({
                id: null,
                title: button.parentElement.querySelector("h3").innerText,
                method: null,
                due: button.parentElement.querySelector("[title*=' ']").title,
                assessment: getAssessmentId(button.parentElement.querySelector("a").href)
            }, "create");
        }
    })
    dueWorkItem.appendChild(reminderButton);
}

function closePopup() {
    document.querySelector(".popup").classList.remove("display");
    createReminderPopup.querySelector("#rem-name").value = "";
    createReminderPopup.querySelector("#link-assessment").checked = "false";
    openReminder = null;
}
let timePicker;

window.addEventListener("load", () => {
    timePicker = flatpickr("#rem-time", {dateFormat: "l F J Y h:iK", enableTime: true, minDate: new Date()});
    timePicker.calendarContainer.addEventListener("click", (ev) => {
        ev.stopPropagation();
    })
})

document.querySelector("#cancel-popup").addEventListener("click", closePopup);

document.querySelector("#create-reminder").addEventListener("click", () => {
    const data = getPopupData();

    request("POST", data).then((response) => {
        if (response.ok && response.status === 200) {
            alert("Reminder Successfully Made")
            const buttonElement = document.querySelector(`a[href*='${openReminder.assessment}']`).parentElement.parentElement.querySelector(".reminder-button");
            buttonElement.innerText = "notifications_active";

            response.json().then((reminder) => {
                buttonElement.dataset.reminder = JSON.stringify(reminder);
            })
        } else {
            alert("Reminder Creation Failed")
        }
        closePopup();
    })
});

document.querySelector("#save-reminder").addEventListener("click", () => {
    const data = getPopupData();

    request("PATCH", data).then((response) => {
        if (response.ok && response.status === 200) {
            alert("Reminder Successfully Edited")

            response.json().then((reminder) => {
                buttonElement.dataset.reminder = JSON.stringify(reminder);
            })
        } else {
            alert("Reminder Editing Failed")
        }
        closePopup();
    })
});

function request(method, body) {
    return fetch("https://api.coolbox.lol/reminders", {
        method: method,
        body: JSON.stringify(body),
        headers: headers
    })
}

function getPopupData() {
    const title = document.querySelector("#rem-name").value;
    const time = timePicker.selectedDates[0].getTime();
    if (document.querySelector(".popup-radio:checked") === null) {
        return alert("Select Notification Method");
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