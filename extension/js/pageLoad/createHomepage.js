let cookie, headers;

// Get the schoolbox login cookie to authenticate with coolbox
chrome.runtime.sendMessage("getCookie", (cook) => {
    cookie = cook.value;

    headers = new Headers({
        "Authorization": "Bearer " + cookie,
        "Content-Type": "application/json"
    })

    fetch(chrome.runtime.getURL("html/homepage.html"), {method: "GET"}).then(homepage => {homepage.text().then(page => {
        document.querySelector("#content").classList.add("hide");
    
        const content = document.createElement("div");
        content.id = "content-new";
        content.innerHTML = parseTemplate(page);
    
        document.querySelector("#container").insertBefore(content, document.querySelector("#content"));
    
        chrome.runtime.sendMessage("pageLoaded");

        document.body.dispatchEvent(new Event("pageLoaded"));
    })});
});