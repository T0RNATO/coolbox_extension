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