chrome.storage.local.get(["subjects"]).then((subjects) => {
    const names = subjects.subjects.subjects;

    for (const subject of document.querySelectorAll(`[data-timetable] td a`)) {
        try {
            const prettySubject = names.find(sub => sub.name.toLowerCase() === subject.nextElementSibling.firstChild.textContent.replace(/[()]/g, "").toLowerCase());
            if (prettySubject !== undefined) {
                subject.innerText = prettySubject.pretty;
            } else {
                console.log(`No pretty subject found for ${subject.innerText}`);
            }
        } catch (error) {
            console.error(error);
        }
    }
}).catch((error) => {
    console.error(error);
});