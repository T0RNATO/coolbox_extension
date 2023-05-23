let cookie, headers, currentReminders, discordAuthenticated, createReminderPopup, viewRemindersPopup, rgbCount, tiles, rows, rgbInterval;
const timeFormat = "l F J Y h:iK"

let editFromViewPopup = false;
let openReminder = null;

const range = n => [...Array(n).keys()]

let rgbValue = 0;

function rgbTiles() {
    rgbValue -= 3;
    rgbCount = 0;
    try {
      for (const i of range(rows)) {
          for (const j of range(5)) {
              tiles[rgbCount].style.setProperty('--rotate', rgbValue + (i + j) * 20)
              rgbCount += 1;
          }
      }
    } catch {}
}

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

function deleteReminder(reminder, then) {
    sendData("DELETE", {id: reminder.id}, "reminders").then((response) => {
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

function sendData(method, body, path) {
    return fetch("https://api.coolbox.lol/" + path, {
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

fetch(chrome.runtime.getURL("html/homepage.html"), {method: "GET"}).then(homepage => {homepage.text().then(page => {
    document.querySelector("#content").classList.add("hide");

    const content = document.createElement("div");
    content.id = "content-new";
    content.innerHTML = parseTemplate(page);

    document.querySelector("#container").insertBefore(content, document.querySelector("#content"));

    if (!isWeekend) {
        updateTime();
    }
    
    // Get the schoolbox login cookie to authenticate with coolbox
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
    
        apiGet("user", (data) => {
            discordAuthenticated = data.discord.linked;
        })
        
        apiGet("stats/message", (message) => {
            if (message.message !== null) {
                const urgentMessage = document.querySelector(".message");
                urgentMessage.innerText = message.message;
            }
        })

        sendData("POST", 
            Array.from(
                document.querySelectorAll("#side-menu-mysubjects .nav-wrapper a")
            ).map(el => {
                return {name: el.innerText}
            }),
        "subjects").then((response) => {response.json().then((json) => {
            for (const subject of document.querySelectorAll(`[data-timetable] td a`)) {
                subject.innerText = json.filter(sub => {return sub.name === subject.nextElementSibling.innerText.replace(/\(|\)/g, "")})[0].pretty;
            }
        })});

        
        
        document.querySelector("#auth").href = "https://api.coolbox.lol/discord/redirect?state=" + cookie;
    })
    
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
    timePicker = flatpickr("#rem-time", {dateFormat: timeFormat, enableTime: true, minDate: new Date(), allowInput: true});
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

    tiles = document.querySelectorAll('li.tile');
    rows = tiles.length / 5;

    chrome.storage.sync.get(["rgb_speed", "pfp"]).then((result) => {
        if (result.rgb_speed - 1) {
            startRgbTiles(result.rgb_speed);
        }
        if (result.pfp) {
            document.querySelector("#search").classList.add("hidePfp");
            document.querySelector("#profile-drop").remove();
        }
    });
})})

function startRgbTiles(speed) {
    clearInterval(rgbInterval);

    if (speed !== 1) {
        rgbInterval = setInterval(rgbTiles, 200 - speed - 1);
        rgbTiles();
    } else {
        for (const tile of tiles) {
            tile.style.setProperty("--rotate", null);
        }
    }
}

function parseTemplate(template) {
    // Remove comments
    template = template.replace(/<!--.*-->/g, "");

    // If-blocks match {if <condition>; <html>}
    // Note: Closing brackets } must be alone on the line
    template = template.replace(/{if ([\s\S]+); *([\s\S]+)^(\s*})/gm, (match, condition, html) => {
        // Eval is understandably blocked in extensions 😥, so I hardcoded it 😔
        if (condition === "!isWeekend" && !isWeekend) {
            return html;
        } else {
            return "";
        }
    });
    
    // Selectorall matches {elements <selector>}
    template = template.replace(/{elements (.*)}/g, (match, selector) => {
        let out = "";
        const elements = document.querySelectorAll(selector);
        if (elements) {
            for (const el of elements) {
                out += el.outerHTML;
            }
            return out;
        }
        return "";
    });

    // Wait until element exists matches {defer <id> <selector>}
    template = template.replace(/{defer (.*?) (.*)}/g, (match, id, selector) => {
        setTimeout(() => {
            elementExistsLoop(0, selector, id);
        }, 50);
        return `<div id="${id}" class="inline"></div>`;
    });

    // Get content of element {content <selector>}
    template = template.replace(/{content (.*)}/g, (match, selector) => {
        const el = document.querySelector(selector);
        if (el) {
            return el.innerHTML;
        }
        return "";
    });

    // Normal selector matches {element <selector>}
    template = template.replace(/{element (.*)}/g, (match, selector) => {
        const el = document.querySelector(selector);
        if (el) {
            return el.outerHTML;
        }
        return "";
    });

    return template;
}

function elementExistsLoop(i, selector, id) {
    let el;
    if (selector === "$week-number") {
        // Goofy hardcoding, dw bout it
        el = Array.from(document.querySelectorAll(".fc-event-title")).filter((e) => {
            return e.innerText.startsWith("Week ");
        })[0]
    } else {
        el = document.querySelector(selector);
    }

    if (el) {
        // More goofy hardcoding
        if (selector === "$week-number") {
            el.innerText = el.innerText.replace(/\(.*/g, "");
        }
        document.getElementById(id).outerHTML = el.outerHTML;
    } else if (i < 40) {
        setTimeout(() => {
            elementExistsLoop(i + 1, selector, id);
        }, 50);
    } else {
        console.warn(`Deferred template element of id ${id} did not load in 2 seconds`);
    }
}

chrome.storage.onChanged.addListener((changes) => {startRgbTiles(changes.rgb_speed.newValue)})