(function () {
  const BDAY_MONTH = 6; // July (0-indexed)
  const BDAY_DAY   = 21;

  function isBirthday() {
    const n = new Date();
    return n.getMonth() === BDAY_MONTH && n.getDate() === BDAY_DAY;
  }

  function nextBirthday() {
    const n = new Date();
    const d = new Date(n.getFullYear(), BDAY_MONTH, BDAY_DAY);
    if (n >= d) d.setFullYear(d.getFullYear() + 1);
    return d;
  }

  function pad(n, len) { return String(n).padStart(len || 2, '0'); }

  function tick() {
    const diff = nextBirthday() - Date.now();
    if (diff <= 0) { location.reload(); return; }
    document.getElementById('cd-days').textContent  = pad(Math.floor(diff / 86400000), 3);
    document.getElementById('cd-hours').textContent = pad(Math.floor(diff % 86400000 / 3600000));
    document.getElementById('cd-mins').textContent  = pad(Math.floor(diff % 3600000  / 60000));
    document.getElementById('cd-secs').textContent  = pad(Math.floor(diff % 60000    / 1000));
  }

  function launchConfetti() {
    const colors = ['#00ff88','#ff4444','#ffdd44','#44aaff','#ff88ff','#ffffff'];
    for (let i = 0; i < 130; i++) {
      setTimeout(() => {
        const el   = document.createElement('div');
        const size = Math.random() * 10 + 5;
        el.className = 'confetti-particle';
        Object.assign(el.style, {
          width:  size + 'px',
          height: (size * (Math.random() > 0.5 ? 0.38 : 1)) + 'px',
          background: colors[Math.floor(Math.random() * colors.length)],
          top: '-20px',
          left: (Math.random() * 100) + 'vw',
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        });
        document.body.appendChild(el);
        const dX  = (Math.random() - 0.5) * 320;
        const dur = Math.random() * 3200 + 2000;
        el.animate([
          { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
          { transform: `translateY(108vh) translateX(${dX}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
        ], { duration: dur, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
      }, i * 22);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bgCanvas = document.getElementById('bgChart');
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const chart = new CandlestickChart(bgCanvas, { volatility: 0.03, candleW: 14, gap: 5 });
    chart.init();
    chart.startScroll(2000);

    if (isBirthday()) {
      document.getElementById('birthdayMode').classList.remove('hidden');
      setTimeout(launchConfetti, 700);
      setTimeout(launchConfetti, 4500);
    } else {
      document.getElementById('countdownMode').classList.remove('hidden');
      tick();
      setInterval(tick, 1000);
    }
  });
})();
