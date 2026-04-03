import { audio } from '../engine/AudioManager.js';
import { drawSoccerBall, drawJersey } from '../utils/draw.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { ParticleSystem } from '../game/ParticleSystem.js';

export class ResultState {
  constructor(sm) { this._sm = sm; }

  enter(data) {
    this._data = data;
    // types: 'champion', 'eliminated_group', 'eliminated_ko'
    this._type = data.type;
    this._wc = data.wc;
    this._particles = new ParticleSystem();
    this._animT = 0;
    this._emitted = false;
    this._numPlayers = data.numPlayers || 1;
  }

  exit() {}

  update(dt, input) {
    this._animT += dt;
    this._particles.update(dt);

    if (!this._emitted && this._animT > 0.5) {
      this._emitted = true;
      if (this._type === 'champion') {
        const champion = this._wc?.champion;
        const colors = champion ? [champion.primary, champion.secondary, '#ffdf00', '#ffffff'] : ['#ffdf00', '#ff6600'];
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            this._particles.emit(
              Math.random() * CANVAS_W, CANVAS_H * 0.4,
              40, colors,
            );
          }, i * 200);
        }
        audio.play('goal');
        setTimeout(() => audio.play('whistle'), 500);
      }
    }

    if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyF') || this._animT > 8) {
      audio.play('uiClick');
      this._sm.change(this._sm._mainMenuState, {});
    }
  }

  render(ctx) {
    const fontFamily = "'Press Start 2P', monospace";

    ctx.fillStyle = '#04080a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Faint field
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(CANVAS_W / 2, 0); ctx.lineTo(CANVAS_W / 2, CANVAS_H); ctx.stroke();
    ctx.beginPath(); ctx.arc(CANVAS_W / 2, CANVAS_H / 2, 100, 0, Math.PI * 2); ctx.stroke();

    this._particles.render(ctx);

    if (this._type === 'champion') {
      this._renderChampion(ctx, fontFamily);
    } else if (this._type === 'eliminated_group') {
      this._renderEliminated(ctx, fontFamily, 'GROUP STAGE');
    } else {
      this._renderEliminated(ctx, fontFamily, this._wc?.getKnockoutRoundName?.() || 'KNOCKOUT');
    }

    ctx.font = `7px ${fontFamily}`;
    ctx.fillStyle = '#334433';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PRESS ENTER TO RETURN TO MENU', CANVAS_W / 2, CANVAS_H - 12);
  }

  _renderChampion(ctx, fontFamily) {
    const champion = this._wc?.champion;
    const pulse = 0.92 + Math.sin(this._animT * 3) * 0.08;

    // Trophy
    ctx.font = `64px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 80);
    ctx.scale(pulse, pulse);
    ctx.fillText('🏆', 0, 0);
    ctx.restore();

    // WORLD CHAMPION
    ctx.font = `18px ${fontFamily}`;
    ctx.fillStyle = '#ffdf00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffdf00';
    ctx.shadowBlur = 20;
    ctx.fillText('WORLD CHAMPION!', CANVAS_W / 2, CANVAS_H / 2 + 10);
    ctx.shadowBlur = 0;

    if (champion) {
      ctx.font = `22px sans-serif`;
      ctx.fillText(champion.flag, CANVAS_W / 2, CANVAS_H / 2 + 50);

      ctx.font = `12px ${fontFamily}`;
      ctx.fillStyle = champion.primary;
      ctx.fillText(champion.name.toUpperCase(), CANVAS_W / 2, CANVAS_H / 2 + 80);
    }
  }

  _renderEliminated(ctx, fontFamily, stage) {
    ctx.font = `14px ${fontFamily}`;
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillText('ELIMINATED', CANVAS_W / 2, CANVAS_H / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.font = `8px ${fontFamily}`;
    ctx.fillStyle = '#888';
    ctx.fillText(`IN THE ${stage.toUpperCase()}`, CANVAS_W / 2, CANVAS_H / 2 - 30);

    // Who won the tournament
    const champion = this._wc?.champion;
    if (champion) {
      ctx.font = `9px ${fontFamily}`;
      ctx.fillStyle = '#ffdf00';
      ctx.fillText('TOURNAMENT WINNER:', CANVAS_W / 2, CANVAS_H / 2 + 20);

      ctx.font = '28px sans-serif';
      ctx.fillText(champion.flag, CANVAS_W / 2, CANVAS_H / 2 + 56);

      ctx.font = `9px ${fontFamily}`;
      ctx.fillStyle = champion.primary;
      ctx.fillText(champion.name.toUpperCase(), CANVAS_W / 2, CANVAS_H / 2 + 82);
    }
  }
}
