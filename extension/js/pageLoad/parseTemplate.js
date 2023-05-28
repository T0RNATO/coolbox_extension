const isWeekend = document.querySelector("[data-timetable-container] section") === null;

function parseTemplate(template) {
    // Remove comments
    template = template.replace(/<!--.*-->/g, "");

    // If-blocks match {if <condition>; <html>}
    // Note: Closing brackets } must be alone on the line
    template = template.replace(/{if ([\s\S]+); ?([\s\S]+)^(\s*})/gm, (match, condition, html) => {
        // Eval is understandably blocked in extensions 😥, so I hardcoded it 😔
        if (condition === "!isWeekend" && !isWeekend) {
            return html;
        } else {
            return "";
        }
    });
    
    // Selectorall matches {elements <selector>}
    template = template.replace(/{elements (.*)}/g, (match, selector) => {
        let out = "";
        const elements = document.querySelectorAll(selector);
        if (elements) {
            for (const el of elements) {
                out += el.outerHTML;
            }
            return out;
        }
        return "";
    });

    // Wait until element exists matches {defer <id> <selector>}
    template = template.replace(/{defer (.*?) (.*)}/g, (match, id, selector) => {
        setTimeout(() => {
            elementExistsLoop(0, selector, id);
        }, 50);
        return `<div id="${id}" class="inline"></div>`;
    });

    // Get content of element {content <selector>}
    template = template.replace(/{content (.*)}/g, (match, selector) => {
        const el = document.querySelector(selector);
        if (el) {
            return el.innerHTML;
        }
        return "";
    });

    // Normal selector matches {element <selector>}
    template = template.replace(/{element (.*)}/g, (match, selector) => {
        const el = document.querySelector(selector);
        if (el) {
            return el.outerHTML;
        }
        return "";
    });

    return template;
}

function elementExistsLoop(i, selector, id) {
    let el;
    if (selector === "$week-number") {
        // Goofy hardcoding, dw bout it
        el = Array.from(document.querySelectorAll(".fc-event-title")).filter((e) => {
            return e.innerText.startsWith("Week ");
        })[0]
    } else {
        el = document.querySelector(selector);
    }

    if (el) {
        // More goofy hardcoding
        if (selector === "$week-number") {
            el.innerText = el.innerText.replace(/\(.*/g, "");
        }
        document.getElementById(id).outerHTML = el.outerHTML;
    } else if (i < 40) {
        setTimeout(() => {
            elementExistsLoop(i + 1, selector, id);
        }, 50);
    } else {
        console.warn(`Deferred template element of id ${id} did not load in 2 seconds`);
    }
}