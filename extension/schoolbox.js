// Get rid of the old news section
const news = document.querySelector("#component10");
news.remove()

// Move it to the right column
document.querySelector(".column-right").appendChild(news)

// Create an observer for an element - the calender box
const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
        // When the calendar element updates, and the week has appeared
        if (
            mutation.type === "childList" &&
            mutation.target.nodeName === "SPAN" &&
            mutation.target.innerText.includes("Week")
            ) {
            
            // Extract the week number
            const week = document.querySelector(".fc-list-event .fc-list-event-title").textContent.split("(")[0].trim();
            
            // And put it in the day text
            document.querySelector("[data-timetable-header]").innerText += " (" + week + ")"

            // Remove the observer
            observer.disconnect();
        }
    }
});

// Begin observing the calendar box
observer.observe(document.querySelector("#component36739"), {attributes: true, childList: true, subtree: true});

// Create an element to show the time left in the period
let timeLeft = document.createElement("span");
timeLeft.id = "timeLeft"

// Add that element to the dom
document.querySelector("#content > .row:first-of-type").appendChild(timeLeft);
document.querySelector("#content > .row:first-of-type").appendChild(document.createElement("hr"));

const periods = [];

// Loop through the timetable popup, and extract the times, and put them into the periods list
for (const periodElement of document.querySelectorAll(".timetable th")) {
    const range = periodElement.querySelector("time").textContent;
    const times = range.split("–");
    periods.push({from: times[0], to: times[1]})
}

const formattedPeriods = [];
let inPeriod = false;

// Format the extracted times into minutes since the day started
for (const period of periods) {
    let formattedPeriod = {}
    for (let [key, time] of Object.entries(period)) {
        ampm = time.slice(-2);
        time = time.slice(0, -2);
        hm = time.split(":");
        if (ampm === "pm") {
            hm[0] = Number(hm[0]) + 12;
        }
        formattedPeriod[key] = hm[0] * 60 + Number(hm[1])
    }
    formattedPeriods.push(formattedPeriod);
}

function updateTime() {
    // Get the current time and format it
    const now = new Date();
    const formattedTime = now.getHours() * 60 + now.getMinutes();
    // Get the current or upcoming period
    const targetPeriod = formattedPeriods.filter((per) => {return per.from > formattedTime | per.to > formattedTime})[0];

    // If nonexistent, school is
    if (targetPeriod === undefined) {
        document.querySelector("#timeLeft").innerHTML = "Day is over!"
        inPeriod = false;
    
    // If you are currently inside a period
    } else if (formattedPeriods.some((per) => {return formattedTime >= per.from && formattedTime < per.to})) {
        const mins = targetPeriod.to - formattedTime
        // If the period has just started, update the timetable display
        if (!inPeriod) {
            updateTimetable();
        }
        // Display time left in period
        inPeriod = true;
        document.querySelector("#timeLeft").innerHTML = `There ${mins > 1 ? "are" : "is"} <strong>${mins} minute${mins > 1 ? "s" : ""}</strong> left in the period.`

    // Else if you are in between periods
    } else {
        const mins = targetPeriod.from - formattedTime;
        // If the period has just ended, update the timetable display
        if (inPeriod) {
            updateTimetable();
        }
        // Display the time until next period
        inPeriod = false;
        document.querySelector("#timeLeft").innerHTML = `There ${mins > 1 ? "are" : "is"} <strong>${mins} minute${mins > 1 ? "s" : ""}</strong> until your next period.`
        
    }
}

const c = new DOMParser();

function updateTimetable() {
    fetch(location.href).then(data => {data.text().then(e => {
        document.querySelector("[data-timetable-container]").replaceWith(c.parseFromString(e, "text/html").querySelector("[data-timetable-container]"));
    })})
}

// Update the timer every 10 seconds
setInterval(updateTime, 10 * 1000)

updateTime();