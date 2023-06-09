let themeEnabled;

chrome.storage.sync.get(["dark_mode", "theme_enabled"]).then((result) => {
    // Old version compat
    if (result.dark_mode) {
        chrome.storage.sync.remove("dark_mode")
        chrome.storage.sync.set({"theme_enabled": true})
        themeEnabled = true;
        updateTheme();
    }
    if (result.theme_enabled) {
        themeEnabled = true;
        updateTheme();
    }
});

chrome.storage.onChanged.addListener((changes) => {
    // Check if change is relevant
    console.log(changes)
    if (changes.theme_enabled || changes.theme) {
        if (changes.theme_enabled) {
            themeEnabled = changes.theme_enabled.newValue;
        }
        updateTheme()
    }
})

function updateTheme() {
    if (themeEnabled) {
        chrome.runtime.sendMessage("enableTheme");
    } else {
        chrome.runtime.sendMessage("disableTheme");
    }
}