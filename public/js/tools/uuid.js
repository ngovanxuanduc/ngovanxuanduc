/**
 * UUID v4 / UUID v7 / ULID — offline, crypto.getRandomValues.
 */
(function () {
  "use strict";

  var out = document.getElementById("uuid-out");
  var nEl = document.getElementById("uuid-n");
  var kindEl = document.getElementById("uuid-kind");
  var upper = document.getElementById("uuid-upper");
  var monoEl = document.getElementById("uuid-mono");
  var meta = document.getElementById("uuid-meta");
  var hint = document.getElementById("uuid-hint");
  var btnGen = document.getElementById("uuid-gen");
  var btnCopy = document.getElementById("uuid-copy");
  var btnClear = document.getElementById("uuid-clear");
  if (!out) return;

  // Crockford Base32 (ULID) — no I L O U
  var CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  var monoState = {
    v7: { ms: -1, rand: null }, // rand: Uint8Array(10) after version/variant bits area simplified
    ulid: { ms: -1, rand: null }, // Uint8Array(10)
  };

  var HINTS = {
    v4: "UUID v4: 122 bit random (RFC 4122). Không mang timestamp.",
    v7: "UUID v7: 48-bit Unix ms + random (RFC 9562). Sort theo thời gian tạo.",
    ulid: "ULID: 48-bit ms + 80-bit random, Crockford Base32 (26 ký tự). Sort-friendly.",
  };

  function bytesToUuid(b) {
    var h = "";
    for (var i = 0; i < 16; i++) {
      h += b[i].toString(16).padStart(2, "0");
    }
    return (
      h.slice(0, 8) +
      "-" +
      h.slice(8, 12) +
      "-" +
      h.slice(12, 16) +
      "-" +
      h.slice(16, 20) +
      "-" +
      h.slice(20)
    );
  }

  function uuidv4() {
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant 10
    return bytesToUuid(b);
  }

  /**
   * UUID v7 (RFC 9562 §5.7)
   * 48-bit unix_ts_ms | ver(4)=7 | rand_a(12) | var(2)=10 | rand_b(62)
   */
  function uuidv7(monotonic) {
    var ms = Date.now();
    var b = new Uint8Array(16);

    // timestamp big-endian 48-bit
    var ts = ms;
    b[0] = (ts / 2 ** 40) & 0xff;
    b[1] = (ts / 2 ** 32) & 0xff;
    b[2] = (ts / 2 ** 24) & 0xff;
    b[3] = (ts / 2 ** 16) & 0xff;
    b[4] = (ts / 2 ** 8) & 0xff;
    b[5] = ts & 0xff;

    var rand;
    if (monotonic && monoState.v7.ms === ms && monoState.v7.rand) {
      rand = monoState.v7.rand.slice();
      // increment 74-bit random area (bytes 6..15 with constraints applied after)
      // We store 10 raw random bytes for rand_a+rand_b before version/variant
      var carry = 1;
      for (var i = 9; i >= 0 && carry; i--) {
        var v = rand[i] + carry;
        rand[i] = v & 0xff;
        carry = v > 0xff ? 1 : 0;
      }
      // if overflow entire random, bump ms artificially is rare; re-randomize
      if (carry) crypto.getRandomValues(rand);
    } else {
      rand = new Uint8Array(10);
      crypto.getRandomValues(rand);
    }

    if (monotonic) {
      monoState.v7.ms = ms;
      monoState.v7.rand = rand.slice();
    }

    // rand_a (12 bits) in low nibble of byte6 after version, and full byte7
    // byte6: version 0111 | rand_a high 4 bits
    b[6] = 0x70 | (rand[0] & 0x0f);
    b[7] = rand[1];
    // byte8: variant 10 | rand_b high 6 bits
    b[8] = 0x80 | (rand[2] & 0x3f);
    b[9] = rand[3];
    b[10] = rand[4];
    b[11] = rand[5];
    b[12] = rand[6];
    b[13] = rand[7];
    b[14] = rand[8];
    b[15] = rand[9];

    return bytesToUuid(b);
  }

  /** Encode 16 bytes (or less) to Crockford base32; ULID uses 16 bytes → 26 chars. */
  function encodeCrockford(bytes, length) {
    // ULID: 128 bits → 26 chars of 5 bits (130 bits with 2 zero pad)
    var chars = new Array(length);
    // process as big integer via bit buffer
    var bits = 0;
    var value = 0;
    var bi = 0;
    // walk bits from left (MSB of byte0)
    var bitPos = bytes.length * 8;
    // ULID encoding: take 5-bit groups from MSB
    var outIdx = 0;
    // simpler: use number accumulation for 128-bit by processing sequentially
    // Standard approach: keep a bit buffer
    for (var i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      while (bits >= 5) {
        chars[outIdx++] = CROCKFORD[(value >>> (bits - 5)) & 31];
        bits -= 5;
        value &= (1 << bits) - 1;
      }
    }
    if (bits > 0 && outIdx < length) {
      chars[outIdx++] = CROCKFORD[(value << (5 - bits)) & 31];
    }
    while (outIdx < length) chars[outIdx++] = "0";
    return chars.join("").slice(0, length);
  }

  function ulid(monotonic) {
    var ms = Date.now();
    var time = new Uint8Array(6);
    var ts = ms;
    time[0] = (ts / 2 ** 40) & 0xff;
    time[1] = (ts / 2 ** 32) & 0xff;
    time[2] = (ts / 2 ** 24) & 0xff;
    time[3] = (ts / 2 ** 16) & 0xff;
    time[4] = (ts / 2 ** 8) & 0xff;
    time[5] = ts & 0xff;

    var rand;
    if (monotonic && monoState.ulid.ms === ms && monoState.ulid.rand) {
      rand = monoState.ulid.rand.slice();
      var carry = 1;
      for (var i = 9; i >= 0 && carry; i--) {
        var v = rand[i] + carry;
        rand[i] = v & 0xff;
        carry = v > 0xff ? 1 : 0;
      }
      if (carry) crypto.getRandomValues(rand);
    } else {
      rand = new Uint8Array(10);
      crypto.getRandomValues(rand);
    }

    if (monotonic) {
      monoState.ulid.ms = ms;
      monoState.ulid.rand = rand.slice();
    }

    var bytes = new Uint8Array(16);
    bytes.set(time, 0);
    bytes.set(rand, 6);
    return encodeCrockford(bytes, 26);
  }

  function applyCase(s) {
    if (!upper || !upper.checked) return s;
    return s.toUpperCase();
  }

  function updateHint() {
    if (!hint || !kindEl) return;
    hint.textContent = HINTS[kindEl.value] || "";
  }

  function generate() {
    var n = Math.min(10000, Math.max(1, parseInt(nEl.value, 10) || 1));
    var kind = (kindEl && kindEl.value) || "v4";
    var monotonic = !!(monoEl && monoEl.checked);
    var lines = new Array(n);
    var label = "UUID v4";

    // Reset mono state at start of batch so batch is ordered from fresh random
    // Actually keep mono across batch - that's the point. Only reset when switching kind.
    for (var i = 0; i < n; i++) {
      var s;
      if (kind === "v7") {
        s = uuidv7(monotonic);
        label = "UUID v7";
      } else if (kind === "ulid") {
        s = ulid(monotonic);
        label = "ULID";
      } else {
        s = uuidv4();
        label = "UUID v4";
      }
      lines[i] = applyCase(s);
    }

    out.value = lines.join("\n");
    if (meta) {
      meta.textContent =
        n +
        " " +
        label +
        (kind !== "v4" && monotonic ? " · monotonic" : "") +
        " · offline";
    }
  }

  if (btnGen) btnGen.addEventListener("click", generate);

  if (kindEl) {
    kindEl.addEventListener("change", function () {
      // reset mono when switching type
      monoState.v7 = { ms: -1, rand: null };
      monoState.ulid = { ms: -1, rand: null };
      updateHint();
      // ULID is inherently uppercase crockford; still allow lower for display
    });
    updateHint();
  }

  if (btnCopy) {
    btnCopy.setAttribute("data-label", "Copy");
    btnCopy.addEventListener("click", function () {
      if (!out.value) {
        if (meta) meta.textContent = "Chưa có output";
        if (window.ToolLib) ToolLib.flashCopyFail(btnCopy);
        return;
      }
      var text = out.value;
      if (window.ToolLib) {
        ToolLib.copyText(text, btnCopy, {
          onOk: function () {
            if (meta)
              meta.textContent =
                "Đã copy " + text.split("\n").length + " dòng";
          },
          onFail: function () {
            if (meta) meta.textContent = "Copy thất bại";
          },
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", function () {
      out.value = "";
      if (meta) meta.textContent = "";
      monoState.v7 = { ms: -1, rand: null };
      monoState.ulid = { ms: -1, rand: null };
    });
  }
})();
