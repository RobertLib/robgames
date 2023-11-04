const SCREEN_WIDTH = 780;
const SCREEN_HEIGHT = 580;

const TILE_SIZE = 20;

const MAP_1_PATTERN = `
#######################################
#                                     #
# # #### ##### # ##### # ##### #### # #
# #    # #  #  #  # #  #  #  # #    # #
# # ## # #  # ### # # ### #  # # ## # #
# # ## # #  # ### # # ### #  # # ## # #
# #    # #  #  #  # #  #  #  # #    # #
# ###### #   # # #   # # #   # ###### #
#        #####   #####   #####        #
# ######       #       #       ###### #
# #      ## ##### ### ##### ##      # #
# ###### ##    #       #    ## ###### #
#      # ## ## # ##### # ## ## #      #
###### #     # # #   # # #     # ######
#      #######   #   #   #######      #
###### #     # # #   # # #     # ######
#      # ## ## # ##### # ## ## #      #
# ###### ##    #   P   #    ## ###### #
# #      ## ##### ### ##### ##      # #
# ######       #       #       ###### #
#        #####   #####   #####        #
# ###### #   # # #   # # #   # ###### #
# #    # #  #  #  # #  #  #  # #    # #
# # ## # #  # ### # # ### #  # # ## # #
# # ## # #  # ### # # ### #  # # ## # #
# #    # #  #  #  # #  #  #  # #    # #
# # #### ##### # ##### # ##### #### # #
#                                     #
#######################################
`;

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");

canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

const ctx = canvas.getContext("2d");

let dt = 0;
let currentTime = Date.now();
let lastTime = currentTime;

const keys = [];

addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

/**
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function collisionWithMap(x, y, w, h) {
  for (const [rowIndex, row] of Object.entries(MAP_1_PATTERN.split("\n"))) {
    for (const [charIndex, char] of Object.entries(row.split(""))) {
      if (char === "#") {
        if (
          x + w > charIndex * TILE_SIZE &&
          x < charIndex * TILE_SIZE + TILE_SIZE &&
          y + h > (rowIndex - 1) * TILE_SIZE &&
          y < (rowIndex - 1) * TILE_SIZE + TILE_SIZE
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function drawMap() {
  for (const [rowIndex, row] of Object.entries(MAP_1_PATTERN.split("\n"))) {
    for (const [charIndex, char] of Object.entries(row.split(""))) {
      if (char === "#") {
        ctx.fillStyle = "#000";
        ctx.fillRect(
          charIndex * TILE_SIZE,
          (rowIndex - 1) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }
  }
}

function main() {
  currentTime = Date.now();
  dt = (currentTime - lastTime) / 1000;

  // Update

  // Draw
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  drawMap();

  requestAnimationFrame(main);

  lastTime = currentTime;
}

requestAnimationFrame(main);
