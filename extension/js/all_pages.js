chrome.storage.sync.get(["pfp"]).then((result) => {
    if (result.pfp) {
        document.querySelector("#search").style.setProperty("right", "4.5em", "important");
        document.querySelector("#profile-drop").remove();
    }
});