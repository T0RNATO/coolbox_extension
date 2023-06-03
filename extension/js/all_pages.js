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
    for (const sidebarSubject of document.querySelectorAll("#side-menu-mysubjects .nav-wrapper a")) {
        const unprettySubject = sidebarSubject.innerText;
        const prettySubject = names.find(sub => sub.name.toLowerCase() === unprettySubject.toLowerCase());
        if (prettySubject !== undefined) {
            sidebarSubject.innerText = `${prettySubject.pretty} (${unprettySubject.slice(unprettySubject.length - 1)})`;
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

if (location.pathname !== "/") {
    chrome.storage.local.get(["subjects"]).then((subjects) => {
        // Don't even worry about this line of code
        subjects = subjects.subjects;
    
        console.log(subjects.subjects)
    
        // If subject names have been saved, and that save has been updated in the last day
        if (subjects?.updated && Date.now() - subjects.updated < 86400000) {
            prettifySubjectNames(subjects.subjects);
        } else {
            fetchPrettySubjectNames();
        }
    }).catch(() => {
        fetchPrettySubjectNames();
    });
}