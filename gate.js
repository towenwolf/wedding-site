(function () {
  var PASSWORD = 'Jointhepack27';
  var AUTH_KEY = 'wedding-auth';

  var style = document.createElement('style');
  style.textContent =
    'html.gate-locked body > *:not(#pw-gate){display:none!important}' +
    '#pw-gate{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'background:#f2ecd9;font-family:Georgia,serif;padding:2rem}' +
    '#pw-gate canvas{image-rendering:pixelated;border:1px solid #a9895a;border-radius:2px;margin-bottom:1.5rem}' +
    '#pw-gate form{text-align:center;max-width:320px}' +
    '#pw-gate input{font-size:1rem;padding:0.6rem 0.8rem;border:1px solid #a9895a;border-radius:2px;width:100%;margin-top:1rem}' +
    '#pw-gate button{margin-top:0.75rem;padding:0.6rem 1.5rem;background:#3f5c42;color:#f2ecd9;border:none;border-radius:2px;font-size:0.9rem;cursor:pointer}' +
    '#pw-gate .pw-error{display:none;color:#7a4426;margin-top:0.75rem;font-size:0.9rem}';
  document.head.appendChild(style);

  if (sessionStorage.getItem(AUTH_KEY) === '1') return;

  document.documentElement.classList.add('gate-locked');

  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.createElement('div');
    overlay.id = 'pw-gate';
    overlay.innerHTML =
      '<canvas id="wolf-canvas" width="280" height="90"></canvas>' +
      '<form>' +
      '<p>This site is password protected.</p>' +
      '<input type="password" autocomplete="off" placeholder="Password" required>' +
      '<button type="submit">Enter</button>' +
      '<p class="pw-error">Incorrect password.</p>' +
      '</form>';
    document.body.prepend(overlay);

    overlay.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = overlay.querySelector('input');
      if (input.value === PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, '1');
        document.documentElement.classList.remove('gate-locked');
        overlay.remove();
        stopWolfScene();
      } else {
        overlay.querySelector('.pw-error').style.display = 'block';
        input.value = '';
        input.focus();
      }
    });

    startWolfScene(overlay.querySelector('#wolf-canvas'));
  });

  // --- whimsical pixel wolf, wandering the desert while you type the password ---
  var wolfTimer = null;

  function stopWolfScene() {
    if (wolfTimer) clearInterval(wolfTimer);
  }

  function startWolfScene(canvas) {
    var ctx = canvas.getContext('2d');
    var U = 3; // pixel-art unit size in css px
    var cssW = canvas.width;
    var cssH = canvas.height;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var COLORS = {
      sky: '#f2ecd9',
      duneFar: '#c9a86c',
      duneNear: '#d8c39a',
      sun: '#c9982f',
      cactus: '#3f5c42',
      cactusShade: '#2f4a3a',
      wolf: '#7a7a7a',
      wolfShade: '#57544a',
      dark: '#22281d'
    };

    ctx.imageSmoothingEnabled = false;

    function px(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x * U), Math.round(y * U), w * U, h * U);
    }

    var groundRow = Math.floor(cssH / U) - 3;

    function drawCactus(gx) {
      var gy = groundRow - 5;
      px(gx, gy, 1, 5, COLORS.cactus);
      px(gx - 2, gy + 2, 2, 1, COLORS.cactus);
      px(gx - 2, gy + 1, 1, 1, COLORS.cactus);
      px(gx + 2, gy + 3, 2, 1, COLORS.cactus);
      px(gx + 3, gy + 2, 1, 1, COLORS.cactus);
      px(gx, gy, 1, 1, COLORS.cactusShade);
    }

    function drawScene() {
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, cssW, cssH);

      px(Math.floor(cssW / U) - 6, 1, 2, 2, COLORS.sun);

      ctx.fillStyle = COLORS.duneFar;
      ctx.fillRect(0, (groundRow - 2) * U, cssW, 2 * U);

      ctx.fillStyle = COLORS.duneNear;
      ctx.fillRect(0, groundRow * U, cssW, cssH - groundRow * U);

      drawCactus(6);
      drawCactus(Math.floor(cssW / U) - 10);
    }

    // wolf drawn in a local 16x9 grid, nose at the right (facing right)
    function drawWolf(originX, legPhase, dip) {
      var oy = groundRow - 8 + dip;
      function w(gx, gy, wUnits, hUnits, color) {
        px(originX + gx, oy + gy, wUnits, hUnits, color);
      }

      w(0, 2, 1, 1, COLORS.wolfShade);
      w(1, 3, 1, 1, COLORS.wolf);

      w(2, 3, 7, 3, COLORS.wolf);
      w(2, 3, 7, 1, COLORS.wolfShade);

      var headDip = dip;
      w(9, 2 + headDip, 4, 3, COLORS.wolf);
      w(10, 1 + headDip, 1, 1, COLORS.wolfShade);
      w(12, 1 + headDip, 1, 1, COLORS.wolfShade);
      w(11, 3 + headDip, 1, 1, COLORS.dark);
      w(13, 3 + headDip, 1, 1, COLORS.dark);

      var lifted = dip ? 1 : 0.4;
      if (legPhase === 0) {
        w(3, 6, 1, 2, COLORS.wolfShade);
        w(5, 6, 1, 2 - lifted, COLORS.wolf);
        w(9, 6, 1, 2 - lifted, COLORS.wolf);
        w(11, 6, 1, 2, COLORS.wolfShade);
      } else {
        w(3, 6, 1, 2 - lifted, COLORS.wolf);
        w(5, 6, 1, 2, COLORS.wolfShade);
        w(9, 6, 1, 2, COLORS.wolfShade);
        w(11, 6, 1, 2 - lifted, COLORS.wolf);
      }
    }

    var SPRITE_W = 16;
    var state = {
      x: -SPRITE_W,
      legPhase: 0,
      mode: 'walk',
      modeTimer: 0,
      dipPhase: 0
    };

    function nextModeDuration(mode) {
      return mode === 'walk' ? 2500 + Math.random() * 2500 : 1200 + Math.random() * 600;
    }
    state.modeTimer = nextModeDuration('walk');

    var TICK_MS = 100;

    function tick() {
      state.modeTimer -= TICK_MS;
      if (state.modeTimer <= 0) {
        state.mode = state.mode === 'walk' ? 'sniff' : 'walk';
        state.modeTimer = nextModeDuration(state.mode);
      }

      if (state.mode === 'walk') {
        state.x += 1.2;
        state.legPhase = Math.floor(state.x / 3) % 2;
        if (state.x * U > cssW) state.x = -SPRITE_W;
      } else {
        state.dipPhase = (state.dipPhase + 1) % 6;
      }

      drawScene();
      var dip = state.mode === 'sniff' ? (state.dipPhase < 3 ? 1 : 2) : 0;
      drawWolf(state.x, state.legPhase, dip);
    }

    if (reduceMotion) {
      drawScene();
      drawWolf(Math.floor(cssW / U / 2 - SPRITE_W / 2), 0, 0);
    } else {
      wolfTimer = setInterval(tick, TICK_MS);
      tick();
    }
  }
})();
