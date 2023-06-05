let cookie;

const rgbInput = document.querySelector("#rgb");

const switches = {
    pfp: {el: document.querySelector("#pfp"), default: false},
    dark_mode: {el: document.querySelector("#dark"), default: false},
    feedback: {el: document.querySelector("#feedback"), default: false}
}

function unlink() {
    fetch("https://api.coolbox.lol/discord", {method: "DELETE", headers: new Headers({
        "Authorization": "Bearer " + cookie,
        "Content-Type": "application/json"
    })}).then(response => {
        if (response.ok) {
            alert("Successfully deauthenticated");
            button.removeEventListener("click", unlink);
            button.classList.remove("danger");
            button.innerText = "Link Discord";
            button.addEventListener("click", link);
        }
    })
}

function link() {
    chrome.tabs.create({
        url: "https://api.coolbox.lol/discord/redirect?state=" + cookie
    })
}

const button = document.querySelector("#unlink");
chrome.runtime.sendMessage("getCookie", (cook) => {
    try {
        cookie = cook.value;
        fetch("https://api.coolbox.lol/user", {method: "GET", headers: new Headers({
            "Authorization": "Bearer " + cookie,
            "Content-Type": "application/json"
        })}).then(response => {response.json().then(data => {
            button.classList.remove("hide");
            if (data.discord.linked) {
                button.classList.add("danger");
                button.innerText = "Unlink Discord"

                button.addEventListener("click", unlink)

            } else {
                button.innerText = "Link Discord";
                button.addEventListener("click", link)
            }
        })})
    } catch {
        document.querySelector("#authError").innerText = "Cannot authenticate, you \nare not logged in!";
    }
})

rgbInput.addEventListener("change", () => {
    chrome.storage.sync.set({
        rgb_speed: Number(rgbInput.value)
    })
})

for (const [name, setting] of Object.entries(switches)) {
    setting.el.addEventListener("click", () => {
        chrome.storage.sync.set({
            [name]: setting.el.checked
        })
    })
}

chrome.storage.sync.get(["rgb_speed", "pfp", "dark_mode", "feedback"]).then((result) => {
    if (result.rgb_speed) {
        rgbInput.value = result.rgb_speed;
    } else {
        rgbInput.value = 1;
    }
    
    for (const [name, setting] of Object.entries(switches)) {
        if (name in result) {
            setting.el.checked = result[name];
        } else {
            setting.el.checked = setting.default;
        }
    }
});