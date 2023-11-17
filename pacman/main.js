"use strict";

(() => {
  const SCREEN_WIDTH = 800;
  const SCREEN_HEIGHT = 600;

  const TILE_SIZE = 30;

  const MAP_PATTERNS = [
    `
#######################################
#    E                                #
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
#                                E    #
#######################################`,
  ];

  const mapRows = MAP_PATTERNS[0].split("\n");

  mapRows.shift();

  const mapWidth = mapRows[0].length;
  const mapHeight = mapRows.length;

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");

  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;

  const ctx = canvas.getContext("2d");

  let dt = 0;
  let currentTime = Date.now();
  let lastTime = currentTime;

  /** @type {{ [key: string]: boolean }} */
  const keys = {};

  addEventListener("keydown", (event) => {
    keys[event.code] = true;
  });

  addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  const camera = {
    x: 0,
    y: 0,
    /**
     * @param {number} targetX
     * @param {number} targetY
     */
    update(targetX, targetY) {
      this.x = targetX - SCREEN_WIDTH / 2;
      this.y = targetY - SCREEN_HEIGHT / 2;

      if (this.x < 0) {
        this.x = 0;
      }

      if (this.x > mapWidth * TILE_SIZE - SCREEN_WIDTH) {
        this.x = mapWidth * TILE_SIZE - SCREEN_WIDTH;
      }

      if (this.y < 0) {
        this.y = 0;
      }

      if (this.y > mapHeight * TILE_SIZE - SCREEN_HEIGHT) {
        this.y = mapHeight * TILE_SIZE - SCREEN_HEIGHT;
      }
    },
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  function collisionWithMap(x, y, w, h) {
    let onCol = Math.ceil(x / TILE_SIZE);
    let onRow = Math.ceil(y / TILE_SIZE);

    const size = 1;

    if (onCol - size < 0) {
      onCol = size;
    }

    if (onCol + 1 + size > mapWidth) {
      onCol = mapWidth - size - 1;
    }

    if (onRow - size < 0) {
      onRow = size;
    }

    if (onRow + 1 + size > mapHeight) {
      onRow = mapHeight - size - 1;
    }

    for (const [rowIndex, row] of Object.entries(
      mapRows.slice(onRow - size, onRow + 1 + size)
    )) {
      for (const [colIndex, col] of Object.entries(
        row.split("").slice(onCol - size, onCol + 1 + size)
      )) {
        if (col === "#") {
          if (
            x + w > (colIndex - size + onCol) * TILE_SIZE &&
            x < (colIndex - size + onCol) * TILE_SIZE + TILE_SIZE &&
            y + h > (rowIndex - size + onRow) * TILE_SIZE &&
            y < (rowIndex - size + onRow) * TILE_SIZE + TILE_SIZE
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /** @param {string} char */
  function coordinatesOnMap(char) {
    const out = [];

    for (const [rowIndex, row] of Object.entries(mapRows)) {
      for (const [colIndex, col] of Object.entries(row.split(""))) {
        if (col === char) {
          out.push({ x: parseInt(colIndex, 10), y: parseInt(rowIndex, 10) });
        }
      }
    }

    return out;
  }

  /**
   * @param {number} targetX
   * @param {number} targetY
   */
  function drawMap(targetX, targetY) {
    let onCol = Math.ceil(targetX / TILE_SIZE);
    let onRow = Math.ceil(targetY / TILE_SIZE);

    const size = 13;

    if (onCol - 1 - size < 0) {
      onCol = size + 1;
    }

    if (onCol + size > mapWidth) {
      onCol = mapWidth - size;
    }

    if (onRow - 1 - size < 0) {
      onRow = size + 1;
    }

    if (onRow + size > mapHeight) {
      onRow = mapHeight - size;
    }

    for (const [rowIndex, row] of Object.entries(
      mapRows.slice(onRow - 1 - size, onRow + size)
    )) {
      for (const [colIndex, col] of Object.entries(
        row.split("").slice(onCol - 1 - size, onCol + size)
      )) {
        if (col === "#") {
          const xScale = colIndex / size;
          const yScale = rowIndex / size;

          ctx.fillStyle = `rgb(0 0 0 / ${
            (xScale > 1 ? 2 - xScale : xScale) *
              (yScale > 1 ? 2 - yScale : yScale) +
            0.7
          })`;

          ctx.fillRect(
            (colIndex - 1 - size + onCol) * TILE_SIZE - camera.x,
            (rowIndex - 1 - size + onRow) * TILE_SIZE - camera.y,
            TILE_SIZE,
            TILE_SIZE
          );
        }
      }
    }
  }

  const playerCoordinate = coordinatesOnMap("P")[0];

  const player = {
    x: playerCoordinate.x * TILE_SIZE + TILE_SIZE / 2,
    y: playerCoordinate.y * TILE_SIZE + TILE_SIZE / 2,
    xVel: 0,
    yVel: 0,
    radius: TILE_SIZE / 2,
    speed: 200,
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
    update() {
      if (
        keys["ArrowLeft"] &&
        !collisionWithMap(...this.rect(-this.speed * dt, 0))
      ) {
        this.xVel = -1;
      } else if (
        keys["ArrowRight"] &&
        !collisionWithMap(...this.rect(this.speed * dt, 0))
      ) {
        this.xVel = 1;
      }

      if (
        keys["ArrowUp"] &&
        !collisionWithMap(...this.rect(0, -this.speed * dt))
      ) {
        this.yVel = -1;
      } else if (
        keys["ArrowDown"] &&
        !collisionWithMap(...this.rect(0, this.speed * dt))
      ) {
        this.yVel = 1;
      }

      if (collisionWithMap(...this.rect(this.xVel * this.speed * dt, 0))) {
        this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + this.radius;
        this.xVel = 0;
      }

      if (collisionWithMap(...this.rect(0, this.yVel * this.speed * dt))) {
        this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + this.radius;
        this.yVel = 0;
      }

      const moveX = this.xVel * this.speed * dt;
      const moveY = this.yVel * this.speed * dt;

      if (Math.abs(moveX) < TILE_SIZE && Math.abs(moveY) < TILE_SIZE) {
        this.x += moveX;
        this.y += moveY;
      }
    },
    draw() {
      ctx.fillStyle = "#00f";
      ctx.beginPath();
      ctx.arc(
        this.x - camera.x,
        this.y - camera.y,
        this.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    },
  };

  class Enemy {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      this.x = x + TILE_SIZE / 2;
      this.y = y + TILE_SIZE / 2;
      this.xVel = 0;
      this.yVel = 0;
      this.radius = TILE_SIZE / 2;
      this.speed = 200;
    }

    rect(xShift = 0, yShift = 0) {
      const radiusX = this.radius / (yShift === 0 ? 1 : 1.5);
      const radiusY = this.radius / (xShift === 0 ? 1 : 1.5);

      return [
        this.x - radiusX + xShift,
        this.y - radiusY + yShift,
        radiusX * 2,
        radiusY * 2,
      ];
    }

    update() {
      /** @type {("left" | "right" | "up" | "down")[]} */
      const nextDir = [];

      if (
        this.xVel !== 1 &&
        !collisionWithMap(...this.rect(-this.speed * dt, 0))
      ) {
        nextDir.push("left");
      }

      if (
        this.xVel !== -1 &&
        !collisionWithMap(...this.rect(this.speed * dt, 0))
      ) {
        nextDir.push("right");
      }

      if (
        this.yVel !== 1 &&
        !collisionWithMap(...this.rect(0, -this.speed * dt))
      ) {
        nextDir.push("up");
      }

      if (
        this.yVel !== -1 &&
        !collisionWithMap(...this.rect(0, this.speed * dt))
      ) {
        nextDir.push("down");
      }

      switch (nextDir[Math.floor(Math.random() * nextDir.length)]) {
        case "left":
          this.xVel = -1;
          break;
        case "right":
          this.xVel = 1;
          break;
        case "up":
          this.yVel = -1;
          break;
        case "down":
          this.yVel = 1;
          break;
      }

      if (collisionWithMap(...this.rect(this.xVel * this.speed * dt, 0))) {
        this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + this.radius;
        this.xVel = 0;
      }

      if (collisionWithMap(...this.rect(0, this.yVel * this.speed * dt))) {
        this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + this.radius;
        this.yVel = 0;
      }

      const moveX = this.xVel * this.speed * dt;
      const moveY = this.yVel * this.speed * dt;

      if (Math.abs(moveX) < TILE_SIZE && Math.abs(moveY) < TILE_SIZE) {
        this.x += moveX;
        this.y += moveY;
      }
    }

    draw() {
      ctx.fillStyle = "#f00";
      ctx.beginPath();
      ctx.arc(
        this.x - camera.x,
        this.y - camera.y,
        this.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  /** @type {Enemy[]} */
  const enemies = [];

  for (const { x, y } of coordinatesOnMap("E")) {
    enemies.push(new Enemy(x * TILE_SIZE, y * TILE_SIZE));
  }

  function main() {
    currentTime = Date.now();
    dt = (currentTime - lastTime) / 1000;

    // Update
    player.update();

    for (const enemy of enemies) {
      enemy.update();
    }

    camera.update(player.x, player.y);

    // Draw
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    drawMap(player.x, player.y);

    player.draw();

    for (const enemy of enemies) {
      enemy.draw();
    }

    requestAnimationFrame(main);

    lastTime = currentTime;
  }

  requestAnimationFrame(main);
})();
