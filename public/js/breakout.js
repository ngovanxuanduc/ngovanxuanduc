/**
 * Breakout — paddle, ball, bricks. Keyboard + pointer.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("bo-canvas");
  var statusEl = document.getElementById("bo-status");
  var scoreEl = document.getElementById("bo-score");
  var livesEl = document.getElementById("bo-lives");
  var levelEl = document.getElementById("bo-level");
  var bestEl = document.getElementById("bo-best");
  var startBtn = document.getElementById("bo-start");
  var resetBtn = document.getElementById("bo-reset");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var W = 360;
  var H = 420;
  canvas.width = W;
  canvas.height = H;

  var BEST_KEY = "game-breakout-best";
  var best = 0;
  try {
    var b = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
    if (Number.isFinite(b) && b > 0) best = b;
  } catch (e) {}

  var COLORS = {
    bg: "#0a0a0b",
    border: "#2a2a32",
    paddle: "#b8a4ff",
    ball: "#f0f0f4",
    text: "#9a9aa8",
    brick: ["#60a5fa", "#5eea93", "#fbbf24", "#f472b6", "#b8a4ff"],
  };

  var PADDLE_W0 = 72;
  var PADDLE_H = 10;
  var BALL_R = 5;
  var BRICK_ROWS = 5;
  var BRICK_COLS = 8;
  var BRICK_H = 14;
  var BRICK_GAP = 4;
  var BRICK_TOP = 52;
  var BRICK_PAD = 12;

  var paddleX;
  var paddleW;
  var ballX;
  var ballY;
  var ballVX;
  var ballVY;
  var bricks;
  var score;
  var lives;
  var level;
  var running;
  var won;
  var dead;
  var raf;
  var keys = { left: false, right: false };
  var lastTs = 0;

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.className = "game-status" + (cls ? " " + cls : "");
    statusEl.textContent = text;
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (livesEl) livesEl.textContent = String(lives);
    if (levelEl) levelEl.textContent = String(level);
    if (bestEl) bestEl.textContent = best > 0 ? String(best) : "—";
  }

  function saveBest() {
    if (score > best) {
      best = score;
      try {
        localStorage.setItem(BEST_KEY, String(best));
      } catch (e) {}
    }
    hud();
  }

  function brickWidth() {
    var inner = W - BRICK_PAD * 2 - BRICK_GAP * (BRICK_COLS - 1);
    return inner / BRICK_COLS;
  }

  function buildBricks() {
    var bw = brickWidth();
    bricks = [];
    for (var r = 0; r < BRICK_ROWS; r++) {
      for (var c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_PAD + c * (bw + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: bw,
          h: BRICK_H,
          hp: 1,
          color: COLORS.brick[r % COLORS.brick.length],
        });
      }
    }
  }

  function resetBall() {
    ballX = W / 2;
    ballY = H - 48;
    var speed = 3.1 + (level - 1) * 0.35;
    var angle = (-Math.PI / 2) + (Math.random() * 0.7 - 0.35);
    ballVX = Math.cos(angle) * speed;
    ballVY = Math.sin(angle) * speed;
    if (ballVY > 0) ballVY = -ballVY;
  }

  function resetPaddle() {
    paddleW = Math.max(48, PADDLE_W0 - (level - 1) * 4);
    paddleX = (W - paddleW) / 2;
  }

  function softReset() {
    score = 0;
    lives = 3;
    level = 1;
    running = false;
    won = false;
    dead = false;
    buildBricks();
    resetPaddle();
    resetBall();
    hud();
    setStatus("Nhấn Bắt đầu. Phá hết gạch để qua màn.");
    draw();
  }

  function bricksLeft() {
    return bricks.filter(function (b) {
      return b.hp > 0;
    }).length;
  }

  function nextLevel() {
    level++;
    buildBricks();
    resetPaddle();
    resetBall();
    running = false;
    hud();
    setStatus("Màn " + level + "! Nhấn Bắt đầu.", "is-win");
    draw();
  }

  function launch() {
    if (dead) {
      softReset();
    }
    if (won) {
      won = false;
    }
    if (!running) {
      if (bricksLeft() === 0) buildBricks();
      running = true;
      lastTs = 0;
      setStatus("Đang chơi…");
      loop(0);
    }
  }

  function loseLife() {
    lives--;
    hud();
    if (lives <= 0) {
      running = false;
      dead = true;
      saveBest();
      setStatus("Hết mạng — điểm " + score + ". Bắt đầu để chơi lại.", "is-draw");
      draw();
      return;
    }
    resetBall();
    resetPaddle();
    running = false;
    setStatus("Mất 1 mạng (" + lives + " còn). Bắt đầu tiếp.");
    draw();
  }

  function collideBricks() {
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (b.hp <= 0) continue;
      if (
        ballX + BALL_R > b.x &&
        ballX - BALL_R < b.x + b.w &&
        ballY + BALL_R > b.y &&
        ballY - BALL_R < b.y + b.h
      ) {
        b.hp = 0;
        score += 10 * level;
        // bounce: prefer vertical unless more overlap on side
        var overlapL = ballX + BALL_R - b.x;
        var overlapR = b.x + b.w - (ballX - BALL_R);
        var overlapT = ballY + BALL_R - b.y;
        var overlapB = b.y + b.h - (ballY - BALL_R);
        var minH = Math.min(overlapL, overlapR);
        var minV = Math.min(overlapT, overlapB);
        if (minH < minV) {
          ballVX = -ballVX;
        } else {
          ballVY = -ballVY;
        }
        hud();
        saveBest();
        if (bricksLeft() === 0) {
          score += 50 * level;
          hud();
          saveBest();
          nextLevel();
        }
        return;
      }
    }
  }

  function step(dt) {
    var move = 0;
    if (keys.left) move -= 1;
    if (keys.right) move += 1;
    if (move) {
      paddleX += move * 0.38 * dt;
    }
    paddleX = Math.max(0, Math.min(W - paddleW, paddleX));

    ballX += ballVX * (dt / 16);
    ballY += ballVY * (dt / 16);

    // walls
    if (ballX - BALL_R < 0) {
      ballX = BALL_R;
      ballVX = Math.abs(ballVX);
    } else if (ballX + BALL_R > W) {
      ballX = W - BALL_R;
      ballVX = -Math.abs(ballVX);
    }
    if (ballY - BALL_R < 0) {
      ballY = BALL_R;
      ballVY = Math.abs(ballVY);
    }

    // paddle
    var pY = H - 28;
    if (
      ballVY > 0 &&
      ballY + BALL_R >= pY &&
      ballY + BALL_R <= pY + PADDLE_H + 6 &&
      ballX >= paddleX - BALL_R &&
      ballX <= paddleX + paddleW + BALL_R
    ) {
      ballY = pY - BALL_R;
      var hit = (ballX - (paddleX + paddleW / 2)) / (paddleW / 2);
      hit = Math.max(-1, Math.min(1, hit));
      var speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      var angle = (-Math.PI / 2) + hit * 1.05;
      ballVX = Math.cos(angle) * speed;
      ballVY = Math.sin(angle) * speed;
      if (ballVY > 0) ballVY = -ballVY;
    }

    collideBricks();

    if (ballY - BALL_R > H) {
      loseLife();
    }
  }

  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // subtle top bar
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(0, 0, W, 1);

    bricks.forEach(function (b) {
      if (b.hp <= 0) return;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(b.x, b.y, b.w, b.h, 3);
      } else {
        ctx.rect(b.x, b.y, b.w, b.h);
      }
      ctx.fill();
    });

    // paddle
    ctx.fillStyle = COLORS.paddle;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(paddleX, H - 28, paddleW, PADDLE_H, 4);
    } else {
      ctx.rect(paddleX, H - 28, paddleW, PADDLE_H);
    }
    ctx.fill();

    // ball
    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    if (!running && !dead) {
      ctx.fillStyle = "rgba(10,10,11,0.35)";
      ctx.fillRect(0, H / 2 - 20, W, 40);
      ctx.fillStyle = COLORS.text;
      ctx.font = "600 13px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Nhấn Bắt đầu", W / 2, H / 2 + 5);
    }
  }

  function loop(ts) {
    if (!running) {
      draw();
      return;
    }
    if (!lastTs) lastTs = ts;
    var dt = Math.min(32, ts - lastTs);
    lastTs = ts;
    step(dt);
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function setPaddleFromClientX(clientX) {
    var rect = canvas.getBoundingClientRect();
    var scale = W / rect.width;
    var x = (clientX - rect.left) * scale;
    paddleX = Math.max(0, Math.min(W - paddleW, x - paddleW / 2));
    if (!running) draw();
  }

  var pointerActive = false;

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      keys.left = true;
      e.preventDefault();
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      keys.right = true;
      e.preventDefault();
    }
    if (e.key === " " || e.key === "Enter") {
      if (
        e.target &&
        (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT")
      )
        return;
      e.preventDefault();
      launch();
    }
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  });

  // Pointer: mouse hover + touch drag (capture so move works off-canvas a bit)
  canvas.addEventListener(
    "pointerdown",
    function (e) {
      pointerActive = true;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
      setPaddleFromClientX(e.clientX);
      e.preventDefault();
    },
    { passive: false }
  );
  canvas.addEventListener(
    "pointermove",
    function (e) {
      // mouse: always follow; touch: only while pressed / captured
      if (
        e.pointerType === "mouse" ||
        pointerActive ||
        e.buttons > 0
      ) {
        setPaddleFromClientX(e.clientX);
      }
      if (e.pointerType === "touch") e.preventDefault();
    },
    { passive: false }
  );
  function endPointer(e) {
    pointerActive = false;
    try {
      if (e && e.pointerId != null) canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") pointerActive = false;
  });

  // Mobile hold buttons ◀ ▶
  function bindHold(btn, dir) {
    if (!btn) return;
    function down(e) {
      e.preventDefault();
      keys[dir] = true;
    }
    function up(e) {
      e.preventDefault();
      keys[dir] = false;
    }
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up);
    btn.addEventListener("pointercancel", up);
    // prevent context menu / focus scroll on long-press
    btn.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }
  bindHold(document.getElementById("bo-left"), "left");
  bindHold(document.getElementById("bo-right"), "right");

  if (startBtn) startBtn.addEventListener("click", launch);
  if (resetBtn)
    resetBtn.addEventListener("click", function () {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      softReset();
    });

  softReset();
})();
