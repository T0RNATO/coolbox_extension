let cookie;

window.onload = () => {
    chrome.runtime.sendMessage("getCookie", (cook) => {
        cookie = cook.value;
        document.querySelector("#unlink").addEventListener("click", () => {
            fetch("https://api.coolbox.lol/discord", {method: "DELETE", headers: new Headers({
                "Authorization": "Bearer " + cookie,
                "Content-Type": "application/json"
            })}).then(response => {
                if (response.ok) {
                    alert("Successfully deauthenticated");
                }
            })
        })
    })
}