(function () {
  const canvas = document.getElementById("snake-canvas");
  const statusEl = document.getElementById("snake-status");
  const scoreEl = document.getElementById("snake-score");
  const startBtn = document.getElementById("snake-start");
  const resetBtn = document.getElementById("snake-reset");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const GRID = 16;
  const CELL = 18;
  canvas.width = GRID * CELL;
  canvas.height = GRID * CELL;

  let snake, dir, nextDir, food, score, tick, running, dead;

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.className = "game-status" + (cls ? " " + cls : "");
    statusEl.textContent = text;
  }

  function updateScore() {
    if (scoreEl) scoreEl.textContent = String(score);
  }

  function randCell() {
    return {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  }

  function placeFood() {
    let p;
    do {
      p = randCell();
    } while (snake.some(function (s) {
      return s.x === p.x && s.y === p.y;
    }));
    food = p;
  }

  function reset() {
    clearInterval(tick);
    tick = null;
    running = false;
    dead = false;
    snake = [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    updateScore();
    placeFood();
    setStatus("Nhấn Bắt đầu hoặc phím mũi tên / WASD.");
    draw();
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  }

  function draw() {
    ctx.fillStyle = "#0a0a0b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.strokeStyle = "#16161a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, GRID * CELL);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(GRID * CELL, i * CELL);
      ctx.stroke();
    }

    drawCell(food.x, food.y, "#a78bfa");
    snake.forEach(function (s, i) {
      drawCell(s.x, s.y, i === 0 ? "#c4b5fd" : "#6d5a9e");
    });
  }

  function step() {
    dir = nextDir;
    const head = {
      x: snake[0].x + dir.x,
      y: snake[0].y + dir.y,
    };

    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= GRID ||
      head.y >= GRID ||
      snake.some(function (s) {
        return s.x === head.x && s.y === head.y;
      })
    ) {
      dead = true;
      running = false;
      clearInterval(tick);
      tick = null;
      setStatus("Game over — điểm " + score + ".", "is-draw");
      draw();
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      updateScore();
      placeFood();
      setStatus("Điểm: " + score);
    } else {
      snake.pop();
    }
    draw();
  }

  function start() {
    if (running) return;
    if (dead) reset();
    running = true;
    setStatus("Đang chơi…");
    tick = setInterval(step, 120);
  }

  function setDir(nx, ny) {
    // no reverse
    if (dir.x + nx === 0 && dir.y + ny === 0) return;
    nextDir = { x: nx, y: ny };
    if (!running && !dead) start();
  }

  document.addEventListener("keydown", function (e) {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].indexOf(k) !== -1) {
      e.preventDefault();
    }
    if (k === "arrowup" || k === "w") setDir(0, -1);
    if (k === "arrowdown" || k === "s") setDir(0, 1);
    if (k === "arrowleft" || k === "a") setDir(-1, 0);
    if (k === "arrowright" || k === "d") setDir(1, 0);
  });

  document.querySelectorAll("[data-snake-dir]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const d = btn.dataset.snakeDir;
      if (d === "up") setDir(0, -1);
      if (d === "down") setDir(0, 1);
      if (d === "left") setDir(-1, 0);
      if (d === "right") setDir(1, 0);
    });
  });

  if (startBtn) startBtn.addEventListener("click", start);
  if (resetBtn) resetBtn.addEventListener("click", reset);

  reset();
})();
