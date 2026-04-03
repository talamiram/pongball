export class GameLoop {
  constructor({ update, render }) {
    this._update = update;
    this._render = render;
    this._rafId = null;
    this._lastTime = null;
    this._running = false;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._tick.bind(this));
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick(now) {
    if (!this._running) return;

    let dt = (now - this._lastTime) / 1000; // seconds
    this._lastTime = now;

    // Cap dt to prevent tunneling on tab switch / lag spike
    if (dt > 0.05) dt = 0.05;

    this._update(dt);
    this._render();

    this._rafId = requestAnimationFrame(this._tick.bind(this));
  }
}
