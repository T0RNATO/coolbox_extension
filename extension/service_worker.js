chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        chrome.cookies.get({"url": sender.url, "name": "PHPSESSID"}, (cookies) => {
            sendResponse(cookies);
        });
        return true;
    }
);