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

/** @param {string} wantedChar */
function coordinatesOnMap(wantedChar) {
  const out = [];

  for (const [rowIndex, row] of Object.entries(MAP_1_PATTERN.split("\n"))) {
    for (const [charIndex, char] of Object.entries(row.split(""))) {
      if (char === wantedChar) {
        out.push({ x: charIndex - 0, y: rowIndex - 1 });
      }
    }
  }

  return out;
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

const playerCoordinates = coordinatesOnMap("P")[0];

const player = {
  x: playerCoordinates.x * TILE_SIZE + 10,
  y: playerCoordinates.y * TILE_SIZE + 10,
  xVel: 0,
  yVel: 0,
  radius: 10,
  speed: 150,
  rect(xShift = 0, yShift = 0) {
    const radiusX = this.radius / (yShift === 0 ? 1 : 1.5);
    const radiusY = this.radius / (xShift === 0 ? 1 : 1.5);

    return [
      this.x - radiusX + xShift,
      this.y - radiusY + yShift,
      radiusX * 2,
      radiusY * 2,
    ];
  },
};

function updatePlayer() {
  if (
    keys["ArrowLeft"] &&
    !collisionWithMap(...player.rect(-player.speed * dt, 0))
  ) {
    player.xVel = -1;
  } else if (
    keys["ArrowRight"] &&
    !collisionWithMap(...player.rect(player.speed * dt, 0))
  ) {
    player.xVel = 1;
  }

  if (
    keys["ArrowUp"] &&
    !collisionWithMap(...player.rect(0, -player.speed * dt))
  ) {
    player.yVel = -1;
  } else if (
    keys["ArrowDown"] &&
    !collisionWithMap(...player.rect(0, player.speed * dt))
  ) {
    player.yVel = 1;
  }

  if (collisionWithMap(...player.rect(player.xVel * player.speed * dt, 0))) {
    player.x = Math.floor(player.x / TILE_SIZE) * TILE_SIZE + player.radius;
    player.xVel = 0;
  }

  if (collisionWithMap(...player.rect(0, player.yVel * player.speed * dt))) {
    player.y = Math.floor(player.y / TILE_SIZE) * TILE_SIZE + player.radius;
    player.yVel = 0;
  }

  player.x += player.xVel * player.speed * dt;
  player.y += player.yVel * player.speed * dt;
}

function drawPlayer() {
  ctx.fillStyle = "#00f";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

function main() {
  currentTime = Date.now();
  dt = (currentTime - lastTime) / 1000;

  // Update
  updatePlayer();

  // Draw
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  drawMap();
  drawPlayer();

  requestAnimationFrame(main);

  lastTime = currentTime;
}

requestAnimationFrame(main);
