let cookie;

window.onload = () => {
    chrome.runtime.sendMessage(null, (cook) => {
        cookie = cook.value;
        document.querySelector("#unlink").addEventListener("click", () => {
            fetch("https://api.coolbox.lol/reminders", {method: "DELETE", headers: new Headers({
                "Authorization": "Bearer " + cookie
            })}).then(response => {response.json().then(success => {
                console.log(success);
            })
        })
    })})
}