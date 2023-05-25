let createReminderPopup, viewRemindersPopup;

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

document.querySelectorAll("input[name='notif-method']").forEach(input => {
    input.addEventListener("click", (event) => {updateWarnings(event.target.value)});
})

createReminderPopup = document.querySelector(".popup");
viewRemindersPopup = document.querySelector(".popupView");
createReminderPopup.addEventListener("click", (e) => {e.stopPropagation()});
viewRemindersPopup.addEventListener("click", (e) => {e.stopPropagation()});

for (const dueWorkItem of document.querySelectorAll(".due-work > li:not(:last-child) div.card")) {
    const reminderButton = document.createElement("div");
    reminderButton.classList.add("reminder-button", "material-symbols-outlined");

    reminderButton.innerText = `notification_add`;

    reminderButton.addEventListener("click", (ev) => {dueWorkItemButtonClick(ev)})
    dueWorkItem.appendChild(reminderButton);
}

// Initialise the calendar
let timePicker = flatpickr("#rem-time", {dateFormat: timeFormat, enableTime: true, minDate: new Date(), allowInput: true});
timePicker.calendarContainer.addEventListener("click", (ev) => {
    ev.stopPropagation();
})

document.querySelector("#cancel-popup").addEventListener("click", closePopup);

document.querySelector("#create-reminder").addEventListener("click", () => {
    const data = getPopupData();

    sendData("POST", data, "reminders").then((response) => {
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

    sendData("PATCH", data, "reminders").then((response) => {
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
        if (editFromViewPopup) {
            editFromViewPopup = false;
            viewRemindersPopup.classList.add("display");
            updateViewRemindersPopup();
        }
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

document.body.addEventListener("click", closePopup);