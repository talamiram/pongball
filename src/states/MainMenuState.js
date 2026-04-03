import { audio } from '../engine/AudioManager.js';
import { drawSoccerBall, drawRoundRect, drawText } from '../utils/draw.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { randomSign, randomRange } from '../utils/math.js';

export class MainMenuState {
  constructor(sm) { this._sm = sm; }

  enter() {
    // Bouncing demo ball
    this._bx = CANVAS_W / 2;
    this._by = CANVAS_H / 2;
    this._bvx = randomSign() * 280;
    this._bvy = randomSign() * 200;

    this._titlePulse = 0;
    this._selected = 0; // 0=1P, 1=2P, 2=4P

    this._modes = [
      { label: '1 PLAYER', desc: 'vs Computer' },
      { label: '2 PLAYERS', desc: 'vs Computer' },
      { label: '4 PLAYERS', desc: 'Local Multiplayer' },
    ];
  }

  exit() {}

  update(dt, input) {
    // Audio init on first input
    audio.init();
    audio.resume();

    // Bounce ball
    this._bx += this._bvx * dt;
    this._by += this._bvy * dt;
    if (this._bx < 20 || this._bx > CANVAS_W - 20) { this._bvx *= -1; this._bx = Math.max(20, Math.min(CANVAS_W - 20, this._bx)); }
    if (this._by < 20 || this._by > CANVAS_H - 20)  { this._bvy *= -1; this._by = Math.max(20, Math.min(CANVAS_H - 20, this._by)); }

    this._titlePulse += dt * 2;

    // Navigation
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
      this._selected = (this._selected + this._modes.length - 1) % this._modes.length;
      audio.play('uiClick');
    }
    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
      this._selected = (this._selected + 1) % this._modes.length;
      audio.play('uiClick');
    }
    if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyF')) {
      audio.play('uiConfirm');
      this._sm.change(this._sm._teamSelectState, { numPlayers: this._selected + 1 });
    }
  }

  render(ctx) {
    // Dark field background
    ctx.fillStyle = '#0d1a0d';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Faint field lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(CANVAS_W / 2, 0); ctx.lineTo(CANVAS_W / 2, CANVAS_H); ctx.stroke();
    ctx.beginPath(); ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 80, 0, Math.PI * 2); ctx.stroke();

    // Bouncing ball
    drawSoccerBall(ctx, this._bx, this._by, 18);

    // Title
    const pulse = 0.92 + Math.sin(this._titlePulse) * 0.08;
    const fontFamily = "'Press Start 2P', monospace";
    ctx.save();
    ctx.translate(CANVAS_W / 2, 110);
    ctx.scale(pulse, pulse);
    ctx.font = `28px ${fontFamily}`;
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18;
    ctx.fillText('PONG WC', 0, 0);
    ctx.restore();

    ctx.font = `10px ${fontFamily}`;
    ctx.fillStyle = '#ffdf00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('WORLD CUP SOCCER', CANVAS_W / 2, 148);

    // Italy 90 era credit
    ctx.font = `6px ${fontFamily}`;
    ctx.fillStyle = '#556655';
    ctx.fillText('IN THE SPIRIT OF ITALIA 90', CANVAS_W / 2, 168);

    // Mode selection
    const boxW = 280, boxH = 52, boxX = CANVAS_W / 2 - boxW / 2;
    const startY = CANVAS_H / 2 - 30;

    this._modes.forEach((mode, i) => {
      const by = startY + i * 64;
      const isSelected = i === this._selected;

      // Box
      drawRoundRect(ctx, boxX, by, boxW, boxH, 6,
        isSelected ? 'rgba(0,255,136,0.18)' : 'rgba(255,255,255,0.05)',
        isSelected ? '#00ff88' : '#334433',
      );
      ctx.lineWidth = isSelected ? 2 : 1;

      // Label
      ctx.font = `10px ${fontFamily}`;
      ctx.fillStyle = isSelected ? '#00ff88' : '#aabbaa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mode.label, CANVAS_W / 2, by + 18);

      ctx.font = `7px ${fontFamily}`;
      ctx.fillStyle = isSelected ? '#88ffcc' : '#556655';
      ctx.fillText(mode.desc, CANVAS_W / 2, by + 36);

      if (isSelected) {
        ctx.font = `10px ${fontFamily}`;
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'right';
        ctx.fillText('►', boxX + boxW - 10, by + boxH / 2);
      }
    });

    // Footer
    ctx.font = `6px ${fontFamily}`;
    ctx.fillStyle = '#334433';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ SELECT   ENTER/SPACE CONFIRM', CANVAS_W / 2, CANVAS_H - 20);
  }
}
