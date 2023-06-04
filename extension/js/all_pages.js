chrome.storage.sync.get(["pfp"]).then((result) => {
    updatePfp(result.pfp);
});

chrome.storage.onChanged.addListener((changes) => {
    // Check if change is relevant
    if (changes.pfp) {
        updatePfp(changes.pfp.newValue);
    }
})

function updatePfp(pfp) {
    if (pfp) {
        document.body.classList.add("hidePfp");
        document.querySelector("#profile-drop").style.setProperty("display", "none");
    } else {
        document.body.classList.remove("hidePfp");
        document.querySelector("#profile-drop").style.setProperty("display", "unset");
    }
}

/**
 * @param {Object[]} names
 * @param {string} names[].name - The unprettified name
 * @param {string} names[].pretty - The prettified name
*/
function prettifySubjectNames(names) {
    // Sidebar subjects
    for (const sidebarSubject of document.querySelectorAll("#side-menu-mysubjects .nav-wrapper a")) {
        const unprettySubject = sidebarSubject.innerText;
        const prettySubject = names.find(sub => sub.name.toLowerCase() === unprettySubject.toLowerCase());
        if (prettySubject !== undefined) {
            sidebarSubject.innerText = `${prettySubject.pretty} (${unprettySubject.slice(unprettySubject.length - 1)})`;
        }
    }

    if (location.pathname === "/") {
        // Timetable subjects
        for (const subject of document.querySelectorAll(`[data-timetable] td a`)) {
            try {
                const unprettySubject = subject.nextElementSibling.innerText;
                const prettySubject = names.find(sub => `(${sub.name.toLowerCase()})` === unprettySubject.toLowerCase());
                if (prettySubject !== undefined) {
                    subject.innerText = prettySubject.pretty;
                } else {
                    console.log(`No pretty subject found for ${unprettySubject}`);
                }
            } catch (error) {
                console.error(error);
            }
        }
    
        // Due work item subjects
        for (const dueWorkItem of document.querySelectorAll(".due-work .meta a")) {
            const unprettySubject = dueWorkItem.innerText;
            // Removes brackets and anything outside of them, and matches that to the subject names
            const prettySubject = names.find(sub =>
                sub.name.toLowerCase() === unprettySubject.replace(/\)|(.*\()/g, "").toLowerCase()
            );
            console.log(dueWorkItem, unprettySubject, prettySubject);
            if (prettySubject !== undefined) {
                dueWorkItem.innerText = prettySubject.pretty;
            }
        }
    }
}

function fetchPrettySubjectNames() {
    const unprettifiedNames = Array.from(
        document.querySelectorAll("#side-menu-mysubjects .nav-wrapper a")
    ).map(el => {return {name: el.innerText}})

    // Fetch pretty names from API
    apiSend("POST", unprettifiedNames, "subjects", (json) => {
        // Update DOM
        prettifySubjectNames(json);
        // Cache results to reduce API load
        chrome.storage.local.set({subjects: {
            updated: Date.now(),
            subjects: json
        }})
    }, (response) => {
        console.error("Failed to fetch pretty subject names from api with response code " + response.status);
    })
}

function getCachedSubjects() {
    // Get cached subjects
    chrome.storage.local.get(["subjects"]).then((subjects) => {
        // Don't even worry about this line of code
        subjects = subjects.subjects;

        console.log(subjects.subjects)

        // If subject names have been saved, and that save has been updated in the last day
        if (subjects?.updated && Date.now() - subjects.updated < 86400000) {
            // Don't bother fetching them again
            prettifySubjectNames(subjects.subjects);
        } else {
            // Otherwise, fetch them
            fetchPrettySubjectNames();
        }
    }).catch(() => {
        // If there are no cached, subjects, fetch them
        fetchPrettySubjectNames();
    });
}

if (location.pathname === "/") {
    document.body.addEventListener("pageLoaded", getCachedSubjects);
} else {
    getCachedSubjects();
}