const mql = window.matchMedia("only screen and (max-width: 64em)");

let tiles_per_row;

function updateTilesPerRow() {
    if (mql.matches) {
        tiles_per_row = 3;
    } else {
        tiles_per_row = 5;
    }
    rows = tiles.length / tiles_per_row;
}

mql.addEventListener("change", updateTilesPerRow);

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

chrome.storage.onChanged.addListener((changes) => {
    // Check if change is relevant
    if (changes.rgb_speed) {
        startRgbTiles(changes.rgb_speed.newValue);
    }
})

let rgbValue = 0;
let rgbInterval, rgbCount;

const tiles = document.querySelectorAll('li.tile');
let rows = tiles.length / tiles_per_row;

function rgbTiles() {
    rgbValue -= 3;
    rgbCount = 0;
    try {
      for (const i of range(rows)) {
          for (const j of range(tiles_per_row)) {
              tiles[rgbCount].style.setProperty('--rotate', rgbValue + (i + j) * 20)
              rgbCount += 1;
          }
      }
    } catch {}
}

chrome.storage.sync.get(["rgb_speed"]).then((result) => {
    if (result.rgb_speed - 1) {
        startRgbTiles(result.rgb_speed);
    }
});

updateTilesPerRow();