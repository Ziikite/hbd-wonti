class CandlestickChart {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.opts   = {
      bgColor:    opts.bgColor    || '#080e08',
      gridColor:  opts.gridColor  || '#0f200f',
      upColor:    opts.upColor    || '#00ff88',
      downColor:  opts.downColor  || '#ff4444',
      candleW:    opts.candleW    || 12,
      gap:        opts.gap        || 4,
      volatility: opts.volatility || 0.025,
      padding:    opts.padding    || 18,
    };
    this.candles = [];
    this.price   = 90 + Math.random() * 40;
    this._timer  = null;
  }

  _genOHLC() {
    const v = this.opts.volatility;
    const change = (Math.random() - 0.47) * 2 * v;
    const open  = this.price;
    const close = open * (1 + change);
    const hi = Math.max(open, close) * (1 + Math.random() * v * 0.7);
    const lo = Math.min(open, close) * (1 - Math.random() * v * 0.7);
    this.price = close;
    return { open, close, high: hi, low: lo };
  }

  init(preload) {
    this._setSize();
    const need = preload || Math.ceil(this.canvas.width / (this.opts.candleW + this.opts.gap)) + 6;
    for (let i = 0; i < need; i++) this.candles.push(this._genOHLC());
    window.addEventListener('resize', () => { this._setSize(); this.draw(); });
    this.draw();
  }

  _setSize() {
    this.canvas.width  = this.canvas.offsetWidth  || window.innerWidth;
    this.canvas.height = this.canvas.offsetHeight || window.innerHeight;
  }

  startScroll(ms = 1800) {
    this._timer = setInterval(() => {
      this.candles.push(this._genOHLC());
      if (this.candles.length > 600) this.candles.shift();
      this.draw();
    }, ms);
  }

  stopScroll() { clearInterval(this._timer); }

  draw(customCandles) {
    const candles = customCandles || this.candles;
    const { ctx, canvas, opts } = this;
    const { bgColor, gridColor, upColor, downColor, candleW, gap, padding } = opts;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    [0.2, 0.4, 0.6, 0.8].forEach(f => {
      const y = Math.round(H * f);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });
    [0.25, 0.5, 0.75].forEach(f => {
      const x = Math.round(W * f);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    });

    if (!candles.length) return;

    const step    = candleW + gap;
    const visible = candles.slice(-Math.ceil(W / step) - 2);
    const prices  = visible.flatMap(c => [c.high, c.low]);
    const pMin    = Math.min(...prices) * 0.997;
    const pMax    = Math.max(...prices) * 1.003;
    const chartH  = H - padding * 2;
    const getY    = p => padding + chartH - ((p - pMin) / (pMax - pMin)) * chartH;

    let x = W - step;
    for (let i = visible.length - 1; i >= 0 && x > -step; i--, x -= step) {
      this._drawCandle(ctx, visible[i], x, candleW, getY, upColor, downColor);
    }
  }

  _drawCandle(ctx, c, x, cW, getY, upColor, downColor) {
    const isUp = c.close >= c.open;
    ctx.fillStyle   = isUp ? upColor : downColor;
    ctx.strokeStyle = isUp ? upColor : downColor;
    ctx.lineWidth   = 1;
    const cx = Math.round(x + cW / 2);
    ctx.beginPath();
    ctx.moveTo(cx, getY(c.high));
    ctx.lineTo(cx, getY(c.low));
    ctx.stroke();
    const bTop = Math.min(getY(c.open), getY(c.close));
    const bH   = Math.max(Math.abs(getY(c.open) - getY(c.close)), 1.5);
    ctx.fillRect(Math.round(x), Math.round(bTop), cW, bH);
  }
}
