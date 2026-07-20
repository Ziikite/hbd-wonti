(function () {
  const CORRECT_NEEDED = 5;
  const WRONG_ALLOWED  = 2;
  const TOTAL_ROUNDS   = 7;

  let candles    = [];
  let nextCandle = null;
  let score      = 0;
  let wrong      = 0;
  let round      = 0;
  let active     = false;
  let basePrice  = 100;

  const gameCanvas = document.getElementById('gameChart');
  const ctx        = gameCanvas.getContext('2d');

  function genOHLC(price) {
    const v = 0.038;
    const change = (Math.random() - 0.5) * 2 * v;
    const open  = price;
    const close = open * (1 + change);
    const hi = Math.max(open, close) * (1 + Math.random() * v * 0.65);
    const lo = Math.min(open, close) * (1 - Math.random() * v * 0.65);
    return { open, close, high: hi, low: lo };
  }

  function drawGame(revealedCandle) {
    const W = gameCanvas.offsetWidth || 700;
    const H = window.innerWidth < 720 ? 220 : 280;
    gameCanvas.width  = W;
    gameCanvas.height = H;

    ctx.fillStyle = '#080e08';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#0f200f';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const y = Math.round(H / 6 * i);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const SLOTS = 10;
    const step = Math.floor((W - 28) / SLOTS);
    const cW   = Math.max(step - 6, 4);
    const startX = 14;

    const allRef = [...candles, ...(nextCandle ? [nextCandle] : [])];
    if (!allRef.length) return;
    const prices = allRef.flatMap(c => [c.high, c.low]);
    const pMin = Math.min(...prices) * 0.996;
    const pMax = Math.max(...prices) * 1.004;
    const pad  = 20;
    const cH   = H - pad * 2;
    const getY = p => pad + cH - ((p - pMin) / (pMax - pMin)) * cH;

    const hist = candles.slice(-(SLOTS - 1));
    hist.forEach((c, i) => {
      const x = startX + i * step;
      drawCandle(c, x, cW, getY);
    });

    const lastX = startX + (SLOTS - 1) * step;

    if (revealedCandle) {
      drawCandle(revealedCandle, lastX, cW, getY);
    } else {
      ctx.strokeStyle = '#2a5a2a';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(lastX, Math.round(getY(pMax * 0.999)), cW, Math.round(getY(pMin * 1.001)) - Math.round(getY(pMax * 0.999)));
      ctx.setLineDash([]);
      ctx.fillStyle    = '#2a5a2a';
      ctx.font         = `${Math.min(cW * 2, 20)}px Courier New`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', lastX + cW / 2, H / 2);
      ctx.textAlign = 'left';
    }
  }

  function drawCandle(c, x, cW, getY) {
    const isUp = c.close >= c.open;
    ctx.fillStyle   = isUp ? '#00ff88' : '#ff4444';
    ctx.strokeStyle = isUp ? '#00ff88' : '#ff4444';
    ctx.lineWidth   = 1;
    const cx = Math.round(x + cW / 2);
    ctx.beginPath();
    ctx.moveTo(cx, getY(c.high));
    ctx.lineTo(cx, getY(c.low));
    ctx.stroke();
    const bTop = Math.min(getY(c.open), getY(c.close));
    const bH   = Math.max(Math.abs(getY(c.open) - getY(c.close)), 2);
    ctx.fillRect(Math.round(x), Math.round(bTop), cW, bH);
  }

  function updateUI() {
    document.getElementById('scoreCorrect').textContent = score;
    document.getElementById('scoreWrong').textContent   = wrong;
    document.getElementById('roundNum').textContent     = Math.min(round + 1, TOTAL_ROUNDS);
    document.getElementById('progressFill').style.width = (score / CORRECT_NEEDED * 100) + '%';
  }

  function showResult(correct) {
    const el = document.getElementById('resultOverlay');
    el.textContent = correct ? '▲ 정답! +1' : '▼ 오답!';
    el.className   = 'game-result-overlay show ' + (correct ? 'correct' : 'wrong');
    setTimeout(() => { el.className = 'game-result-overlay'; }, 1400);
  }

  function setBtns(disabled) {
    document.getElementById('btnUp').disabled   = disabled;
    document.getElementById('btnDown').disabled = disabled;
  }

  function prepareRound() {
    const lastPrice = candles.length ? candles[candles.length - 1].close : basePrice;
    nextCandle = genOHLC(lastPrice);
    drawGame(null);
    setBtns(false);
  }

  function predict(dir) {
    if (!active || !nextCandle) return;
    setBtns(true);
    round++;

    const actual  = nextCandle.close >= nextCandle.open ? 'up' : 'down';
    const correct = dir === actual;
    if (correct) score++; else wrong++;

    drawGame(nextCandle);
    candles.push(nextCandle);
    if (candles.length > 120) candles.shift();
    nextCandle = null;

    showResult(correct);
    updateUI();

    setTimeout(() => {
      if (score >= CORRECT_NEEDED) {
        showWin();
      } else if (wrong > WRONG_ALLOWED || round >= TOTAL_ROUNDS) {
        showLose();
      } else {
        prepareRound();
      }
    }, 1500);
  }

  function launchConfetti() {
    const colors = ['#00ff88','#ffdd44','#ff88ff','#44aaff','#ffffff','#ff8844'];
    for (let i = 0; i < 160; i++) {
      setTimeout(() => {
        const el   = document.createElement('div');
        const size = Math.random() * 12 + 5;
        el.className = 'confetti-particle';
        Object.assign(el.style, {
          width:  size + 'px',
          height: (size * (Math.random() > 0.5 ? 0.35 : 1)) + 'px',
          background: colors[Math.floor(Math.random() * colors.length)],
          top: '-20px',
          left: (Math.random() * 100) + 'vw',
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        });
        document.body.appendChild(el);
        const dX  = (Math.random() - 0.5) * 420;
        const dur = Math.random() * 3500 + 2000;
        el.animate([
          { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
          { transform: `translateY(110vh) translateX(${dX}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
        ], { duration: dur, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
      }, i * 18);
    }
  }

  function showWin() {
    active = false;
    document.getElementById('winScreen').classList.add('show');
    setTimeout(launchConfetti, 350);
    setTimeout(launchConfetti, 2200);
  }

  function showLose() {
    active = false;
    document.getElementById('loseScreen').classList.add('show');
  }

  function startGame() {
    score = 0; wrong = 0; round = 0;
    candles = [];
    basePrice = 70 + Math.random() * 70;
    active = true;

    document.getElementById('winScreen').classList.remove('show');
    document.getElementById('loseScreen').classList.remove('show');

    let p = basePrice;
    for (let i = 0; i < 9; i++) {
      const c = genOHLC(p);
      candles.push(c);
      p = c.close;
    }
    basePrice = p;
    updateUI();
    prepareRound();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bgCanvas = document.getElementById('bgChart');
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const bgChart = new CandlestickChart(bgCanvas, { volatility: 0.03, candleW: 14, gap: 5 });
    bgChart.init();
    bgChart.startScroll(2000);

    document.getElementById('btnUp').addEventListener('click',       () => predict('up'));
    document.getElementById('btnDown').addEventListener('click',     () => predict('down'));
    document.getElementById('btnRestart').addEventListener('click',  startGame);
    document.getElementById('btnWinRestart').addEventListener('click', startGame);
    document.getElementById('btnRetry').addEventListener('click',    startGame);

    window.addEventListener('resize', () => { if (active) drawGame(null); });

    startGame();
  });
})();
