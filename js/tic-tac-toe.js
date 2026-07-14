(function () {
  const boardEl = document.getElementById("ttt-board");
  const statusEl = document.getElementById("ttt-status");
  const resetBtn = document.getElementById("ttt-reset");
  if (!boardEl || !statusEl) return;

  const WIN = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  let board = Array(9).fill(null);
  let current = "X";
  let over = false;

  function cells() {
    return boardEl.querySelectorAll(".ttt-cell");
  }

  function setStatus(html, cls) {
    statusEl.className = "game-status" + (cls ? " " + cls : "");
    statusEl.innerHTML = html;
  }

  function checkWin() {
    for (const [a, b, c] of WIN) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], line: [a, b, c] };
      }
    }
    return null;
  }

  function render() {
    cells().forEach(function (cell, i) {
      const v = board[i];
      cell.textContent = v || "";
      cell.classList.remove("is-x", "is-o", "is-win");
      if (v === "X") cell.classList.add("is-x");
      if (v === "O") cell.classList.add("is-o");
      cell.disabled = over || !!v;
    });
  }

  function end(win) {
    over = true;
    if (win) {
      win.line.forEach(function (i) {
        cells()[i].classList.add("is-win");
      });
      setStatus("<strong>" + win.player + "</strong> thắng!", "is-win");
    } else {
      setStatus("Hòa!", "is-draw");
    }
    cells().forEach(function (c) {
      c.disabled = true;
    });
  }

  function play(i) {
    if (over || board[i]) return;
    board[i] = current;
    const win = checkWin();
    if (win) {
      render();
      end(win);
      return;
    }
    if (board.every(Boolean)) {
      render();
      end(null);
      return;
    }
    current = current === "X" ? "O" : "X";
    render();
    setStatus("Lượt <strong>" + current + "</strong>");
  }

  function reset() {
    board = Array(9).fill(null);
    current = "X";
    over = false;
    render();
    setStatus("Lượt <strong>X</strong>");
  }

  boardEl.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ttt-cell";
    btn.setAttribute("aria-label", "Ô " + (i + 1));
    btn.addEventListener("click", function () {
      play(i);
    });
    boardEl.appendChild(btn);
  }

  if (resetBtn) resetBtn.addEventListener("click", reset);
  reset();
})();
