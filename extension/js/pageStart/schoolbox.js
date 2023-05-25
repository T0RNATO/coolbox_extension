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
        time = time.replace("am", ":am").replace("pm", ":pm")
        const times = time.split(":");
        const date = new Date();

        let hours = Number(times[0]);
        if (times[2] === "pm" && hours !== 12) {
            hours += 12;
        }
        
        date.setHours(hours)
        date.setMinutes(Number(times[1]));
        
        formattedPeriod[key] = date.getTime();
    }
    formattedPeriods.push(formattedPeriod);
}

function updateTime() {
    const timeLeft = document.querySelector("#timeLeft");

    const now = Date.now();

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
        chrome.storage.local.get(["subjects"]).then((subjects) => {
            console.log(subjects, subjects.subjects.subjects);
            prettifySubjectNames(subjects.subjects.subjects);
        })
    })})
}

if (!isWeekend) {
    // Update the timer every 10 seconds
    setInterval(updateTime, 10 * 1000);
    updateTime();
}

apiGet("user", (data) => {
    discordAuthenticated = data.discord.linked;
})

apiGet("stats/message", (message) => {
    if (message.message !== null) {
        const urgentMessage = document.querySelector(".message");
        urgentMessage.innerText = message.message;
    }
})

/**
 * @param {Object[]} names
 * @param {string} names[].name - The unprettified name
 * @param {string} names[].pretty - The prettified name
*/
function prettifySubjectNames(names) {
    for (const subject of document.querySelectorAll(`[data-timetable] td a`)) {
        subject.innerText = names.filter(sub => {
            return sub.name.toLowerCase() === subject.nextElementSibling.innerText.replace(/\(|\)/g, "").toLowerCase();
        })[0].pretty;
    }
}

chrome.storage.local.get(["subjects"]).then((subjects) => {
    // Don't even worry about this line of code
    subjects = subjects.subjects;

    // If subject names have been saved, and that save has been updated in the last day
    if (subjects.updated && Date.now() - subjects.updated < 86400000) {
        prettifySubjectNames(subjects.subjects);
    } else {
        const unprettifiedNames = Array.from(
            document.querySelectorAll("#side-menu-mysubjects .nav-wrapper a")
        ).map(el => {return {name: el.innerText}})

        // Fetch pretty names from API
        sendData("POST", unprettifiedNames, "subjects").then((response) => {response.json().then((json) => {
            // Update DOM
            prettifySubjectNames(json);
            // Cache results to reduce API load
            chrome.storage.local.set({subjects: {
                updated: Date.now(),
                subjects: json
            }})
        })});
    }
})