const isWeekend = document.querySelector("[data-timetable-container] section") === null;

// Get rid of the old news section
const news = document.querySelector("#component10");
news.remove()

// Move it to the right column
document.querySelector(".column-right").appendChild(news)

let calendarUpdated = false;

// Create an observer for the calender box
const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
        // When the calendar element updates, and the week has appeared
        if (
            mutation.type === "childList" &&
            mutation.target.nodeName === "SPAN" &&
            mutation.target.innerText.includes("Week") &&
            !calendarUpdated
            ) {
            
            // Extract the week number
            const week = document.querySelector(".fc-list-event .fc-list-event-title").textContent.split("(")[0].trim();
            
            // And put it in the day text
            document.querySelector("[data-timetable-header]").innerText += " (" + week + ")"

            // Remove the observer
            observer.disconnect();
            calendarUpdated = true;
        }
    }
});

// Begin observing the calendar box
observer.observe(document.querySelector("#component36739"), {attributes: true, childList: true, subtree: true});

// Create an element to show the time left in the period
let timeLeft = document.createElement("span");
timeLeft.id = "timeLeft"

// Add that element to the dom
if (!isWeekend) {
    document.querySelector("#content > .row:first-of-type").appendChild(timeLeft);
    document.querySelector("#content > .row:first-of-type").appendChild(document.createElement("hr"));
}

const periods = [];

// Loop through the timetable popup, and extract the times, and put them into the periods list
for (const periodElement of document.querySelectorAll(".timetable th")) {
    const range = periodElement.querySelector("time").textContent;
    const times = range.split("–");
    periods.push({from: times[0], to: times[1]})
}

const formattedPeriods = [];
let inPeriod = false;

// Format the extracted times into epochs
for (const period of periods) {
    let formattedPeriod = {}
    for (let [key, time] of Object.entries(period)) {
        const date = flatpickr.parseDate(new Date().toDateString() + " " + time, "D M d Y h:iK");
        formattedPeriod[key] = date.getTime();
    }
    formattedPeriods.push(formattedPeriod);
}

function updateTime() {
    const timeLeft = document.querySelector("#timeLeft");

    // const now = Date.now();
    const now = 1673818200000;

    // Get the current or upcoming period
    const targetPeriod = formattedPeriods.filter((per) => {return per.from > now | per.to > now})[0];

    // If nonexistent, school is over
    if (targetPeriod === undefined) {
        document.querySelector("#timeLeft").innerHTML = "";
        inPeriod = false;
    
    // If you are currently inside a period
    } else if (formattedPeriods.some((per) => {return now >= per.from && now < per.to})) {
        const timeDiff = targetPeriod.to - now;
        const mins = Math.ceil(timeDiff / 1000 / 60);
        // If the period has just started, update the timetable display
        if (!inPeriod) {
            updateTimetable();
        }
        // Display time left in period
        inPeriod = true;
        timeLeft.innerHTML = `There ${mins > 1 ? "are" : "is"} <strong>${mins} minute${mins > 1 ? "s" : ""}</strong> left in the period.`

    // Otherwise, you're in between periods
    } else {
        const timeDiff = targetPeriod.from - now;
        const mins = Math.ceil(timeDiff / 1000 / 60);
        // If the period has just ended, update the timetable display
        if (inPeriod) {
            updateTimetable();
        }
        // Display the time until next period
        inPeriod = false;
        timeLeft.innerHTML = `There ${mins > 1 ? "are" : "is"} <strong>${mins} minute${mins > 1 ? "s" : ""}</strong> until your next period.`
    }
}

const c = new DOMParser();

function updateTimetable() {
    fetch(location.href).then(data => {data.text().then(e => {
        document.querySelector("[data-timetable-container] section").replaceWith(c.parseFromString(e, "text/html").querySelector("[data-timetable-container] section"));
    })})
}

if (!isWeekend) {
    // Update the timer every 10 seconds
    setInterval(updateTime, 10 * 1000)
    updateTime();

    const greeting = document.querySelector("#component9");
    const timetableParent = document.querySelector("#component36911");

    const divider = document.createElement("hr");
    divider.classList.add("topHr");

    timetableParent.insertBefore(divider, timetableParent.children[0]);
    timetableParent.insertBefore(greeting, timetableParent.children[0]);
}

// EXPERIMENTAL QUICK NOTES
// const reminders = document.createElement("div");
// reminders.classList.add("notes_container")
// reminders.innerHTML = `
// <h1 class="rem_title">Quick Notes</h1>
// <textarea class="notes"></textarea>
// `
// document.querySelector("#component52395 section").appendChild(reminders);