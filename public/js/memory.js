(function () {
  const boardEl = document.getElementById("memory-board");
  const statusEl = document.getElementById("memory-status");
  const movesEl = document.getElementById("memory-moves");
  const pairsEl = document.getElementById("memory-pairs");
  const resetBtn = document.getElementById("memory-reset");
  if (!boardEl) return;

  const EMOJIS = ["🎮", "🚀", "🌙", "⚡", "🎯", "🧩", "🎲", "☕"];

  let cards = [];
  let flipped = [];
  let lock = false;
  let moves = 0;
  let pairs = 0;
  let flipTimer = null;
  let gameId = 0;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.className = "game-status" + (cls ? " " + cls : "");
    statusEl.textContent = text;
  }

  function updateStats() {
    if (movesEl) movesEl.textContent = String(moves);
    if (pairsEl) pairsEl.textContent = pairs + " / " + EMOJIS.length;
  }

  function clearFlipTimer() {
    if (flipTimer != null) {
      clearTimeout(flipTimer);
      flipTimer = null;
    }
  }

  function build() {
    gameId += 1;
    clearFlipTimer();

    const deck = shuffle(EMOJIS.concat(EMOJIS));
    cards = deck.map(function (emoji, id) {
      return { id: id, emoji: emoji, matched: false };
    });
    flipped = [];
    lock = false;
    moves = 0;
    pairs = 0;
    updateStats();
    setStatus("Lật hai thẻ giống nhau.");
    boardEl.innerHTML = "";

    cards.forEach(function (card, index) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-card";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", "Thẻ " + (index + 1));
      btn.innerHTML =
        '<span class="memory-card__inner">' +
        '<span class="memory-card__face memory-card__front">?</span>' +
        '<span class="memory-card__face memory-card__back">' +
        card.emoji +
        "</span>" +
        "</span>";
      btn.addEventListener("click", function () {
        flip(index, btn);
      });
      boardEl.appendChild(btn);
    });
  }

  function flip(index, btn) {
    const card = cards[index];
    if (lock || card.matched || btn.classList.contains("is-flipped")) return;
    if (flipped.length === 1 && flipped[0].index === index) return;

    btn.classList.add("is-flipped");
    flipped.push({ index: index, btn: btn });

    if (flipped.length < 2) return;

    moves += 1;
    updateStats();
    lock = true;

    const a = cards[flipped[0].index];
    const b = cards[flipped[1].index];

    if (a.emoji === b.emoji) {
      a.matched = true;
      b.matched = true;
      flipped[0].btn.classList.add("is-matched");
      flipped[1].btn.classList.add("is-matched");
      flipped[0].btn.disabled = true;
      flipped[1].btn.disabled = true;
      pairs += 1;
      updateStats();
      flipped = [];
      lock = false;

      if (pairs === EMOJIS.length) {
        setStatus("Xong! " + moves + " lượt.", "is-win");
      }
    } else {
      const first = flipped[0].btn;
      const second = flipped[1].btn;
      const currentGame = gameId;
      clearFlipTimer();
      flipTimer = setTimeout(function () {
        flipTimer = null;
        if (currentGame !== gameId) return;
        first.classList.remove("is-flipped");
        second.classList.remove("is-flipped");
        flipped = [];
        lock = false;
      }, 650);
    }
  }

  if (resetBtn) resetBtn.addEventListener("click", build);
  build();
})();
