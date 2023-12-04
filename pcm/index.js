"use strict";

(() => {
  const SCREEN_WIDTH = 800;
  const SCREEN_HEIGHT = 600;

  const TILE_SIZE = 30;

  const MAP_PATTERNS = [
    `
#######################################
#    E                           E    #
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
#    E                           E    #
#######################################`,
  ];

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

  const controlArrows = document.querySelector("#control .arrows");

  controlArrows.addEventListener("touchstart", (event) => {
    event.preventDefault();
  });

  for (const controlArrow of /** @type {HTMLButtonElement[]} */ (
    controlArrows.children
  )) {
    const eventCode = `Arrow${
      controlArrow.className.charAt(0).toUpperCase() +
      controlArrow.className.slice(1)
    }`;

    controlArrow.addEventListener("touchstart", (event) => {
      event.preventDefault();

      keys[eventCode] = true;
    });

    controlArrow.addEventListener("touchend", () => {
      keys[eventCode] = false;
    });
  }

  /** @type {HTMLButtonElement | null} */
  const controlAction = document.querySelector("#control .action");

  controlAction.addEventListener("touchstart", (event) => {
    event.preventDefault();

    keys["Space"] = true;
  });

  controlAction.addEventListener("touchend", () => {
    keys["Space"] = false;
  });

  let pause = false;

  /**
   * @param {number} a
   * @param {number} b
   * @param {number} t
   */
  function lerp(a, b, t) {
    return (b - a) * t + a;
  }

  class Map {
    constructor() {
      const rows = MAP_PATTERNS[0].split("\n");

      rows.shift();

      this.width = rows[0].length;
      this.height = rows.length;
      this.rows = rows;
      this.size = 14;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    collisionWith(x, y, w, h) {
      let onCol = Math.ceil(x / TILE_SIZE);
      let onRow = Math.ceil(y / TILE_SIZE);

      const size = 1;

      if (onCol - size < 0) {
        onCol = size;
      }

      if (onCol + 1 + size > this.width) {
        onCol = this.width - size - 1;
      }

      if (onRow - size < 0) {
        onRow = size;
      }

      if (onRow + 1 + size > this.height) {
        onRow = this.height - size - 1;
      }

      for (const [rowIndex, row] of Object.entries(
        map.rows.slice(onRow - size, onRow + 1 + size)
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
    coordinatesFor(char) {
      const out = [];

      for (const [rowIndex, row] of Object.entries(map.rows)) {
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
    draw(targetX, targetY) {
      let onCol = Math.ceil(targetX / TILE_SIZE);
      let onRow = Math.ceil(targetY / TILE_SIZE);

      if (onCol - 1 - this.size < 0) {
        onCol = this.size + 1;
      }

      if (onCol + this.size > this.width) {
        onCol = this.width - this.size;
      }

      if (onRow - 1 - this.size < 0) {
        onRow = this.size + 1;
      }

      if (onRow + this.size > this.height) {
        onRow = this.height - this.size;
      }

      for (const [rowIndex, row] of Object.entries(
        map.rows.slice(onRow - 1 - this.size, onRow + this.size)
      )) {
        for (const [colIndex, col] of Object.entries(
          row.split("").slice(onCol - 1 - this.size, onCol + this.size)
        )) {
          if (col === "#") {
            const xScale = colIndex / this.size;
            const yScale = rowIndex / this.size;

            ctx.fillStyle = `rgb(0 0 0 / ${
              (xScale > 1 ? 2 - xScale : xScale) *
                (yScale > 1 ? 2 - yScale : yScale) +
              0.7
            })`;

            ctx.fillRect(
              (colIndex - 1 - this.size + onCol) * TILE_SIZE - camera.x,
              (rowIndex - 1 - this.size + onRow) * TILE_SIZE - camera.y,
              TILE_SIZE,
              TILE_SIZE
            );
          }
        }
      }
    }
  }

  const map = new Map();

  const PLAYERS_LIFE_COUNT = 3;

  class Player {
    constructor() {
      const { x, y } = map.coordinatesFor("P")[0];

      this.x = x * TILE_SIZE + TILE_SIZE / 2;
      this.y = y * TILE_SIZE + TILE_SIZE / 2;
      this.xVel = 0;
      this.yVel = 0;
      this.radius = TILE_SIZE / 2;
      this.speed = 200;
      /** @type {"left" | "right" | "up" | "down" | null} */
      this.nextDir = null;
      this.lives = PLAYERS_LIFE_COUNT;
      this.immortality = false;
      this.immortalityTimer = 0;
      this.isGameOver = false;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    collisionWith(x, y, radius) {
      if (this.immortality) {
        return;
      }

      const a = x - this.x;
      const b = y - this.y;
      const c = Math.sqrt(a * a + b * b);

      return Math.abs(c) < radius;
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

    resetPosition() {
      const { x, y } = map.coordinatesFor("P")[0];

      this.x = x * TILE_SIZE + TILE_SIZE / 2;
      this.y = y * TILE_SIZE + TILE_SIZE / 2;
      this.xVel = 0;
      this.yVel = 0;
    }

    takeLife() {
      this.lives--;

      if (this.lives > 0) {
        this.resetPosition();

        this.immortality = true;
      } else {
        pause = true;

        this.isGameOver = true;
      }
    }

    update() {
      if (pause) {
        return;
      }

      if (keys["ArrowLeft"] || this.nextDir === "left") {
        this.nextDir = "left";

        if (!map.collisionWith(...this.rect(-this.speed * dt, 0))) {
          this.xVel = -1;
        }
      }

      if (keys["ArrowRight"] || this.nextDir === "right") {
        this.nextDir = "right";

        if (!map.collisionWith(...this.rect(this.speed * dt, 0))) {
          this.xVel = 1;
        }
      }

      if (keys["ArrowUp"] || this.nextDir === "up") {
        this.nextDir = "up";

        if (!map.collisionWith(...this.rect(0, -this.speed * dt))) {
          this.yVel = -1;
        }
      }

      if (keys["ArrowDown"] || this.nextDir === "down") {
        this.nextDir = "down";

        if (!map.collisionWith(...this.rect(0, this.speed * dt))) {
          this.yVel = 1;
        }
      }

      if (map.collisionWith(...this.rect(this.xVel * this.speed * dt, 0))) {
        this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + this.radius;
        this.xVel = 0;
      }

      if (map.collisionWith(...this.rect(0, this.yVel * this.speed * dt))) {
        this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + this.radius;
        this.yVel = 0;
      }

      const moveX = this.xVel * this.speed * dt;
      const moveY = this.yVel * this.speed * dt;

      if (Math.abs(moveX) < TILE_SIZE && Math.abs(moveY) < TILE_SIZE) {
        this.x += moveX;
        this.y += moveY;
      }

      if (this.immortality) {
        this.immortalityTimer += dt;

        if (this.immortalityTimer > 3) {
          this.immortality = false;
          this.immortalityTimer = 0;
        }
      }
    }

    draw() {
      ctx.fillStyle = `rgba(0, 0, 255, ${this.immortality ? 0.5 : 1})`;
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

  let player = new Player();

  class Camera {
    /**
     * @param {number} targetX
     * @param {number} targetY
     */
    constructor(targetX, targetY) {
      this.x = targetX - SCREEN_WIDTH / 2;
      this.y = targetY - SCREEN_HEIGHT / 2;
    }

    /**
     * @param {number} targetX
     * @param {number} targetY
     */
    update(targetX, targetY) {
      this.x = lerp(this.x, targetX - SCREEN_WIDTH / 2, 7 * dt);
      this.y = lerp(this.y, targetY - SCREEN_HEIGHT / 2, 7 * dt);

      if (this.x < 0) {
        this.x = 0;
      }

      if (this.x > map.width * TILE_SIZE - SCREEN_WIDTH) {
        this.x = map.width * TILE_SIZE - SCREEN_WIDTH;
      }

      if (this.y < 0) {
        this.y = 0;
      }

      if (this.y > map.height * TILE_SIZE - SCREEN_HEIGHT) {
        this.y = map.height * TILE_SIZE - SCREEN_HEIGHT;
      }
    }
  }

  const camera = new Camera(player.x, player.y);

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
      this.speed = 210;
      /** @type {"left" | "right" | "up" | "down" | null} */
      this.playersLastSeenDir = null;
      this.playersLastSeenDirTimer = 0;
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

    evaluatingNextDir() {
      if (this.playersLastSeenDir) {
        return;
      }

      /** @type {("left" | "right" | "up" | "down")[]} */
      const nextDir = [];

      if (
        this.xVel !== 1 &&
        !map.collisionWith(...this.rect(-this.speed * dt, 0))
      ) {
        nextDir.push("left");
      }

      if (
        this.xVel !== -1 &&
        !map.collisionWith(...this.rect(this.speed * dt, 0))
      ) {
        nextDir.push("right");
      }

      if (
        this.yVel !== 1 &&
        !map.collisionWith(...this.rect(0, -this.speed * dt))
      ) {
        nextDir.push("up");
      }

      if (
        this.yVel !== -1 &&
        !map.collisionWith(...this.rect(0, this.speed * dt))
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
    }

    /** @param {"left" | "right" | "up" | "down"} dir */
    canSeePlayer(dir) {
      const length = 10;

      switch (dir) {
        case "left":
          for (
            let x = this.x;
            x > this.x - TILE_SIZE * length;
            x -= TILE_SIZE
          ) {
            if (player.collisionWith(x, this.y, this.radius)) {
              return true;
            }
          }
          break;
        case "right":
          for (
            let x = this.x;
            x < this.x + TILE_SIZE * length;
            x += TILE_SIZE
          ) {
            if (player.collisionWith(x, this.y, this.radius)) {
              return true;
            }
          }
          break;
        case "up":
          for (
            let y = this.y;
            y > this.y - TILE_SIZE * length;
            y -= TILE_SIZE
          ) {
            if (player.collisionWith(this.x, y, this.radius)) {
              return true;
            }
          }
          break;
        case "down":
          for (
            let y = this.y;
            y < this.y + TILE_SIZE * length;
            y += TILE_SIZE
          ) {
            if (player.collisionWith(this.x, y, this.radius)) {
              return true;
            }
          }
          break;
      }

      return false;
    }

    changingDirWhenSpottingPlayer() {
      if (this.canSeePlayer("left")) {
        this.xVel = -1;
        this.playersLastSeenDir = "left";
      }

      if (this.canSeePlayer("right")) {
        this.xVel = 1;
        this.playersLastSeenDir = "right";
      }

      if (this.canSeePlayer("up")) {
        this.yVel = -1;
        this.playersLastSeenDir = "up";
      }

      if (this.canSeePlayer("down")) {
        this.yVel = 1;
        this.playersLastSeenDir = "down";
      }

      if (this.playersLastSeenDir) {
        this.playersLastSeenDirTimer += dt;

        if (this.playersLastSeenDirTimer > 1) {
          this.playersLastSeenDir = null;
          this.playersLastSeenDirTimer = 0;
        }
      }
    }

    update() {
      if (pause) {
        return;
      }

      this.evaluatingNextDir();

      this.changingDirWhenSpottingPlayer();

      if (map.collisionWith(...this.rect(this.xVel * this.speed * dt, 0))) {
        this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + this.radius;
        this.xVel = 0;
      }

      if (map.collisionWith(...this.rect(0, this.yVel * this.speed * dt))) {
        this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + this.radius;
        this.yVel = 0;
      }

      if (player.collisionWith(this.x, this.y, this.radius)) {
        player.takeLife();
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

  class Enemies {
    constructor() {
      /** @type {Enemy[]} */
      this.enemies = [];

      for (const { x, y } of map.coordinatesFor("E")) {
        this.enemies.push(new Enemy(x * TILE_SIZE, y * TILE_SIZE));
      }
    }

    update() {
      for (const enemy of this.enemies) {
        enemy.update();
      }
    }

    draw() {
      for (const enemy of this.enemies) {
        enemy.draw();
      }
    }
  }

  let enemies = new Enemies();

  class StatusBar {
    draw() {
      for (let i = 0; i < player.lives; i++) {
        ctx.fillStyle = "#00f";
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.arc(
          SCREEN_WIDTH - 25 * i - 20,
          20,
          player.radius / 1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  const statusBar = new StatusBar();

  class GameOver {
    update() {
      if (!player.isGameOver) {
        return;
      }

      if (keys["Space"] || keys["Enter"]) {
        pause = false;

        player = new Player();
        enemies = new Enemies();
      }
    }

    draw() {
      if (!player.isGameOver) {
        return;
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

      ctx.font = "60px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    }
  }

  const gameOver = new GameOver();

  function gameLoop() {
    currentTime = Date.now();
    dt = (currentTime - lastTime) / 1000;

    // Update
    player.update();
    camera.update(player.x, player.y);
    enemies.update();
    gameOver.update();

    // Draw
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    map.draw(player.x, player.y);
    player.draw();
    enemies.draw();
    statusBar.draw();
    gameOver.draw();

    requestAnimationFrame(gameLoop);

    lastTime = currentTime;
  }

  requestAnimationFrame(gameLoop);
})();
