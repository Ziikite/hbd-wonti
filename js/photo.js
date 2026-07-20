(function () {
  let overlayInterval = null;

  const video    = document.getElementById('webcamVideo');
  const overlay  = document.getElementById('videoOverlay');
  const gallery  = document.getElementById('photoGallery');
  const capBtn   = document.getElementById('captureBtn');
  const errMsg   = document.getElementById('webcamError');

  function drawOverlay() {
    if (!video.videoWidth) return;
    const W = overlay.offsetWidth  || video.offsetWidth;
    const H = overlay.offsetHeight || video.offsetHeight;
    overlay.width  = W;
    overlay.height = H;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Corner brackets
    const b = 22;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 6;
    [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([x,y,dx,dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * b); ctx.lineTo(x, y); ctx.lineTo(x + dx * b, y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Timestamp
    const now = new Date();
    const ts  = [
      now.getFullYear(),
      String(now.getMonth()+1).padStart(2,'0'),
      String(now.getDate()).padStart(2,'0')
    ].join('-') + ' ' + now.toLocaleTimeString('ko-KR', { hour12: false });
    ctx.fillStyle   = '#00ff88';
    ctx.font        = '11px Courier New';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 4;
    ctx.textBaseline = 'bottom';
    ctx.fillText(ts, 9, H - 9);

    // Mini bar chart (decorative)
    const bars = 6, bW = 5, bGap = 3;
    const bMaxH = H * 0.22;
    for (let i = 0; i < bars; i++) {
      const h = bMaxH * (0.3 + Math.random() * 0.7);
      ctx.fillStyle = Math.random() > 0.5 ? '#00ff88' : '#ff4444';
      ctx.shadowBlur = 0;
      ctx.fillRect(W - 56 + i * (bW + bGap), H - 9 - h, bW, h);
    }
  }

  async function initWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      errMsg.textContent = '이 브라우저는 카메라를 지원하지 않습니다.';
      errMsg.classList.remove('hidden');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'user' }, audio: false });
      video.srcObject = stream;
      await video.play();
      capBtn.disabled = false;
      errMsg.classList.add('hidden');
      overlayInterval = setInterval(drawOverlay, 1000);
      drawOverlay();
    } catch (e) {
      errMsg.innerHTML = `카메라 접근 실패:<br><small>${e.message}</small><br>브라우저 주소창의 카메라 권한을 허용해주세요.`;
      errMsg.classList.remove('hidden');
    }
  }

  function capturePhoto() {
    const cW = video.videoWidth  || 640;
    const cH = video.videoHeight || 480;
    const cap = document.createElement('canvas');
    cap.width  = cW;
    cap.height = cH;
    const ctx = cap.getContext('2d');

    ctx.drawImage(video, 0, 0, cW, cH);

    // Bottom bar
    const barH = Math.round(cH * 0.1);
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, cH - barH, cW, barH);
    ctx.fillStyle   = '#00ff88';
    ctx.font        = `bold ${Math.round(barH * 0.42)}px Courier New`;
    ctx.textBaseline = 'middle';
    const now = new Date();
    const label = `WONTI STOCK  |  ${now.toLocaleDateString('ko-KR')}  |  HAPPY BIRTHDAY 🎂`;
    ctx.fillText(label, Math.round(cW * 0.02), cH - barH / 2);

    // Corner brackets on photo
    const b = Math.round(cW * 0.04);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth   = 2;
    [[0,0,1,1],[cW,0,-1,1],[0,cH-barH,1,-1],[cW,cH-barH,-1,-1]].forEach(([x,y,dx,dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * b); ctx.lineTo(x, y); ctx.lineTo(x + dx * b, y);
      ctx.stroke();
    });

    addPolaroid(cap.toDataURL('image/png'));

    // Flash effect
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position:'fixed', inset:'0', background:'rgba(0,255,136,0.25)',
      zIndex:'999', pointerEvents:'none', transition:'opacity 0.4s'
    });
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; }, 50);
    setTimeout(() => flash.remove(), 500);
  }

  function addPolaroid(dataURL) {
    // Remove placeholder
    const placeholder = gallery.querySelector('.gallery-placeholder');
    if (placeholder) placeholder.remove();

    const card = document.createElement('div');
    card.className = 'polaroid';

    const img = document.createElement('img');
    img.src = dataURL;

    const lbl = document.createElement('div');
    lbl.className = 'polaroid-label';
    lbl.textContent = `WONTI CAM  |  ${new Date().toLocaleString('ko-KR')}`;

    const controls = document.createElement('div');
    controls.className = 'polaroid-controls';

    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-green';
    dlBtn.style.fontSize = '11px';
    dlBtn.style.padding  = '5px 12px';
    dlBtn.textContent = '⬇ 다운로드';
    dlBtn.onclick = () => {
      const a = document.createElement('a');
      a.href     = dataURL;
      a.download = `wonti-hbd-${Date.now()}.png`;
      a.click();
    };

    controls.appendChild(dlBtn);
    card.appendChild(img);
    card.appendChild(lbl);
    card.appendChild(controls);
    gallery.insertBefore(card, gallery.firstChild);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bgCanvas = document.getElementById('bgChart');
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const bgChart = new CandlestickChart(bgCanvas, { volatility: 0.03, candleW: 14, gap: 5 });
    bgChart.init();
    bgChart.startScroll(2000);

    capBtn.disabled = true;
    capBtn.addEventListener('click', capturePhoto);
    initWebcam();
  });
})();
