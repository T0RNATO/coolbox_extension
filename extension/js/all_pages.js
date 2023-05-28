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
        document.querySelector("#search").style.setProperty("right", "4.5em", "important");
        document.querySelector("#profile-drop").style.setProperty("display", "none");
    } else {
        document.querySelector("#search").style.setProperty("right", null);
        document.querySelector("#profile-drop").style.setProperty("display", "unset");
    }
}