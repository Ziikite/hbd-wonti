(function () {
  let overlayInterval = null;

  const video   = document.getElementById('webcamVideo');
  const overlay = document.getElementById('videoOverlay');
  const gallery = document.getElementById('photoGallery');
  const capBtn  = document.getElementById('captureBtn');
  const errMsg  = document.getElementById('webcamError');

  /* ── 오버레이 ── */
  function drawOverlay() {
    if (!video.videoWidth) return;
    const W = overlay.offsetWidth  || video.offsetWidth;
    const H = overlay.offsetHeight || video.offsetHeight;
    overlay.width  = W;
    overlay.height = H;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, W, H);

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

    const now = new Date();
    const ts  = [
      now.getFullYear(),
      String(now.getMonth()+1).padStart(2,'0'),
      String(now.getDate()).padStart(2,'0')
    ].join('-') + ' ' + now.toLocaleTimeString('ko-KR', { hour12: false });
    ctx.fillStyle    = '#00ff88';
    ctx.font         = '11px Courier New';
    ctx.shadowColor  = '#00ff88';
    ctx.shadowBlur   = 4;
    ctx.textBaseline = 'bottom';
    ctx.fillText(ts, 9, H - 9);

    const bars = 6, bW = 5, bGap = 3, bMaxH = H * 0.22;
    for (let i = 0; i < bars; i++) {
      const h = bMaxH * (0.3 + Math.random() * 0.7);
      ctx.fillStyle  = Math.random() > 0.5 ? '#00ff88' : '#ff4444';
      ctx.shadowBlur = 0;
      ctx.fillRect(W - 56 + i * (bW + bGap), H - 9 - h, bW, h);
    }
  }

  /* ── 웹캠 ── */
  async function initWebcam() {
    if (!navigator.mediaDevices?.getUserMedia) {
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
      errMsg.innerHTML = `카메라 접근 실패:<br><small>${e.message}</small><br>브라우저 주소창의 카메라 아이콘을 허용해주세요.`;
      errMsg.classList.remove('hidden');
    }
  }

  /* ── 촬영 ── */
  function capturePhoto() {
    const cW = video.videoWidth  || 640;
    const cH = video.videoHeight || 480;
    const cap = document.createElement('canvas');
    cap.width = cW; cap.height = cH;
    const ctx = cap.getContext('2d');

    ctx.drawImage(video, 0, 0, cW, cH);

    const barH = Math.round(cH * 0.1);
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, cH - barH, cW, barH);
    ctx.fillStyle    = '#00ff88';
    ctx.font         = `bold ${Math.round(barH * 0.42)}px Courier New`;
    ctx.textBaseline = 'middle';
    const now   = new Date();
    const label = `WONTI STOCK  |  ${now.toLocaleDateString('ko-KR')}  |  HAPPY BIRTHDAY 🎂`;
    ctx.fillText(label, Math.round(cW * 0.02), cH - barH / 2);

    const b = Math.round(cW * 0.04);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth   = 2;
    [[0,0,1,1],[cW,0,-1,1],[0,cH-barH,1,-1],[cW,cH-barH,-1,-1]].forEach(([x,y,dx,dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * b); ctx.lineTo(x, y); ctx.lineTo(x + dx * b, y);
      ctx.stroke();
    });

    const dataURL = cap.toDataURL('image/png');
    uploadPhoto(dataURL, now);

    // 플래시 효과
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position:'fixed', inset:'0', background:'rgba(0,255,136,0.25)',
      zIndex:'999', pointerEvents:'none', transition:'opacity 0.4s'
    });
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; }, 50);
    setTimeout(() => flash.remove(), 500);
  }

  /* ── Firebase 업로드 ── */
  async function uploadPhoto(dataURL, date) {
    const card = addPolaroid(dataURL, date, true);
    setStatus(card, '업로드 중... 📡');

    try {
      const res  = await fetch(dataURL);
      const blob = await res.blob();
      const path = `photos/${Date.now()}.png`;
      const ref  = storage.ref(path);

      await ref.put(blob);
      const url = await ref.getDownloadURL();

      await db.collection('photos').add({
        url,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setStatus(card, '✓ 저장 완료');
      setTimeout(() => setStatus(card, ''), 2000);
    } catch (e) {
      console.error('Upload failed:', e);
      setStatus(card, '⚠ 저장 실패 (로컬에만 보임)');
    }
  }

  /* ── Firebase에서 기존 사진 로드 ── */
  async function loadPhotos() {
    const placeholder = gallery.querySelector('.gallery-placeholder');
    if (placeholder) placeholder.textContent = '사진 불러오는 중... 📡';

    try {
      const snap = await db.collection('photos')
        .orderBy('createdAt', 'desc')
        .limit(30)
        .get();

      if (placeholder) placeholder.remove();

      if (snap.empty) {
        showEmptyGallery();
        return;
      }

      snap.forEach(doc => {
        const { url, createdAt } = doc.data();
        addPolaroidFromURL(url, createdAt?.toDate());
      });
    } catch (e) {
      console.error('Load failed:', e);
      if (placeholder) {
        placeholder.textContent = 'Firebase 연결 실패. Firestore/Storage를 활성화해주세요.';
        placeholder.style.color = 'var(--red)';
      }
    }
  }

  /* ── 갤러리 카드 생성 ── */
  function addPolaroid(dataURL, date, prepend = false) {
    removePlaceholder();
    const card = createCard(date);
    const img  = document.createElement('img');
    img.src = dataURL;
    card.insertBefore(img, card.firstChild);
    if (prepend) gallery.insertBefore(card, gallery.firstChild);
    else         gallery.appendChild(card);

    const dlBtn = card.querySelector('.dl-btn');
    dlBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = dataURL; a.download = `wonti-hbd-${Date.now()}.png`; a.click();
    };
    return card;
  }

  function addPolaroidFromURL(url, date) {
    const card = createCard(date);
    const img  = document.createElement('img');
    img.src   = url;
    img.onerror = () => card.remove();
    card.insertBefore(img, card.firstChild);
    gallery.appendChild(card);

    const dlBtn = card.querySelector('.dl-btn');
    dlBtn.onclick = () => { window.open(url, '_blank'); };
  }

  function createCard(date) {
    const card = document.createElement('div');
    card.className = 'polaroid';

    const lbl = document.createElement('div');
    lbl.className = 'polaroid-label';
    lbl.textContent = `WONTI CAM  |  ${date ? date.toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')}`;

    const status = document.createElement('div');
    status.className = 'polaroid-status';
    status.style.cssText = 'font-size:10px;color:var(--green-dim);text-align:center;min-height:14px;margin-top:4px;';

    const controls = document.createElement('div');
    controls.className = 'polaroid-controls';
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-green dl-btn';
    dlBtn.style.cssText = 'font-size:11px;padding:5px 12px;';
    dlBtn.textContent = '⬇ 다운로드';
    controls.appendChild(dlBtn);

    card.appendChild(lbl);
    card.appendChild(status);
    card.appendChild(controls);
    return card;
  }

  function setStatus(card, msg) {
    const el = card.querySelector('.polaroid-status');
    if (el) el.textContent = msg;
  }

  function removePlaceholder() {
    const p = gallery.querySelector('.gallery-placeholder');
    if (p) p.remove();
  }

  function showEmptyGallery() {
    if (!gallery.querySelector('.gallery-placeholder')) {
      const p = document.createElement('div');
      p.className = 'gallery-placeholder';
      p.style.cssText = 'color:var(--text-dim);font-size:12px;text-align:center;padding:44px 0;line-height:2;';
      p.innerHTML = '아직 찍힌 사진이 없습니다.<br>왼쪽 카메라로 찍어보세요!';
      gallery.appendChild(p);
    }
  }

  /* ── 초기화 ── */
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
    loadPhotos();
  });
})();
