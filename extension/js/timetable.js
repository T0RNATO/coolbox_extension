chrome.storage.local.get(["subjects"]).then((subjects) => {
    const names = subjects.subjects.subjects;

    for (const subject of document.querySelectorAll(`[data-timetable] td a`)) {
        subject.innerText = names.filter(sub => {
            return sub.name.toLowerCase() === subject.nextElementSibling.firstChild.textContent.replace(/[()]/g, "").toLowerCase();
        })[0].pretty;
    }
})