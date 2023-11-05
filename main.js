"use strict";

(() => {
  const SCREEN_WIDTH = 780;
  const SCREEN_HEIGHT = 580;

  const TILE_SIZE = 20;

  const MAP_1_PATTERN = `
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
#######################################`;

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

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  function collisionWithMap(x, y, w, h) {
    const onCol = Math.ceil(x / TILE_SIZE);
    const onRow = Math.floor(y / TILE_SIZE);

    for (const [rowIndex, row] of Object.entries(
      MAP_1_PATTERN.split("\n").slice(onRow, onRow + 3)
    )) {
      for (const [colIndex, col] of Object.entries(
        row.split("").slice(onCol - 1, onCol + 2)
      )) {
        if (col === "#") {
          if (
            x + w > (colIndex - 1 + onCol) * TILE_SIZE &&
            x < (colIndex - 1 + onCol) * TILE_SIZE + TILE_SIZE &&
            y + h > (rowIndex - 1 + onRow) * TILE_SIZE &&
            y < (rowIndex - 1 + onRow) * TILE_SIZE + TILE_SIZE
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

    for (const [rowIndex, row] of Object.entries(MAP_1_PATTERN.split("\n"))) {
      for (const [colIndex, col] of Object.entries(row.split(""))) {
        if (col === char) {
          out.push({ x: colIndex - 0, y: rowIndex - 1 });
        }
      }
    }

    return out;
  }

  function drawMap() {
    for (const [rowIndex, row] of Object.entries(MAP_1_PATTERN.split("\n"))) {
      for (const [colIndex, col] of Object.entries(row.split(""))) {
        if (col === "#") {
          ctx.fillStyle = "#000";
          ctx.fillRect(
            colIndex * TILE_SIZE,
            (rowIndex - 1) * TILE_SIZE,
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
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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
      this.speed = 150;
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
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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

    // Draw
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    drawMap();

    player.draw();

    for (const enemy of enemies) {
      enemy.draw();
    }

    requestAnimationFrame(main);

    lastTime = currentTime;
  }

  requestAnimationFrame(main);
})();
