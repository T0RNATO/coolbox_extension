chrome.storage.sync.get(["dark_mode"]).then((result) => {
    if (result.dark_mode) {
        updateDarkMode(true);
    }
});

chrome.storage.onChanged.addListener((changes) => {
    // Check if change is relevant
    if (changes.dark_mode) {
        updateDarkMode(changes.dark_mode.newValue)
    }
})

function updateDarkMode(on) {
    if (on) {
        chrome.runtime.sendMessage("enableDarkMode");
    } else {
        chrome.runtime.sendMessage("disableDarkMode");
    }
}