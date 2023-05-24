function startRgbTiles(speed) {
    clearInterval(rgbInterval);

    if (speed !== 1) {
        rgbInterval = setInterval(rgbTiles, 200 - speed - 1);
        rgbTiles();
    } else {
        for (const tile of tiles) {
            tile.style.setProperty("--rotate", null);
        }
    }
}

chrome.storage.onChanged.addListener((changes) => {startRgbTiles(changes.rgb_speed.newValue)})

let rgbValue = 0;
let rgbInterval, rgbCount;

const tiles = document.querySelectorAll('li.tile');
const rows = tiles.length / 5;

function rgbTiles() {
    rgbValue -= 3;
    rgbCount = 0;
    try {
      for (const i of range(rows)) {
          for (const j of range(5)) {
              tiles[rgbCount].style.setProperty('--rotate', rgbValue + (i + j) * 20)
              rgbCount += 1;
          }
      }
    } catch {}
}

chrome.storage.sync.get(["rgb_speed", "pfp"]).then((result) => {
    if (result.rgb_speed - 1) {
        startRgbTiles(result.rgb_speed);
    }
    if (result.pfp) {
        document.querySelector("#search").classList.add("hidePfp");
        document.querySelector("#profile-drop").remove();
    }
});