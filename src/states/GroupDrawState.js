import { WorldCup } from '../tournament/WorldCup.js';
import { audio } from '../engine/AudioManager.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { drawRoundRect } from '../utils/draw.js';

export class GroupDrawState {
  constructor(sm) { this._sm = sm; }

  enter(data) {
    this._numPlayers = data.numPlayers || 1;
    this._wc = new WorldCup(data.playerTeamId);
    this._revealIndex = 0;
    this._revealTimer = 0;
    this._revealInterval = 0.12;
    this._done = false;
    this._waitTimer = 0;
  }

  exit() {}

  update(dt, input) {
    if (!this._done) {
      this._revealTimer += dt;
      const totalTeams = 16;
      if (this._revealTimer > this._revealInterval) {
        this._revealTimer = 0;
        this._revealIndex = Math.min(this._revealIndex + 1, totalTeams);
        if (this._revealIndex === totalTeams) {
          this._done = true;
          audio.play('whistle');
        } else {
          audio.play('uiClick');
        }
      }
    } else {
      this._waitTimer += dt;
      if (
        this._waitTimer > 1.5 ||
        input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyF')
      ) {
        audio.play('uiConfirm');
        // Simulate all CPU group matches
        for (let gi = 0; gi < 4; gi++) {
          this._wc.simulateCPUGroupMatches(gi);
        }
        this._sm.change(this._sm._groupStageState, {
          wc: this._wc,
          numPlayers: this._numPlayers,
        });
      }
    }
  }

  render(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.font = `14px ${fontFamily}`;
    ctx.fillStyle = '#ffdf00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#ffdf00';
    ctx.shadowBlur = 10;
    ctx.fillText('GROUP DRAW', CANVAS_W / 2, 20);
    ctx.shadowBlur = 0;

    const groups = this._wc.groups;
    const groupNames = ['A', 'B', 'C', 'D'];
    const colW = CANVAS_W / 4;
    const rowH = 60;
    const startY = 70;
    const playerTeamId = this._wc.playerTeamId;

    let count = 0;
    for (let gi = 0; gi < 4; gi++) {
      const gx = gi * colW + colW / 2;

      ctx.font = `10px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`GROUP ${groupNames[gi]}`, gx, startY);

      for (let ti = 0; ti < groups[gi].length; ti++) {
        count++;
        if (count > this._revealIndex) continue;

        const team = groups[gi][ti];
        const ty = startY + 24 + ti * 56;
        const isPlayer = team.id === playerTeamId;

        drawRoundRect(ctx,
          gi * colW + 10, ty,
          colW - 20, 48, 5,
          isPlayer ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)',
          isPlayer ? '#00ff88' : '#333',
        );

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(team.flag, gi * colW + 16, ty + 10);

        ctx.font = `7px ${fontFamily}`;
        ctx.fillStyle = isPlayer ? '#00ff88' : '#ccc';
        ctx.textAlign = 'left';
        ctx.fillText(team.code, gi * colW + 44, ty + 16);
      }
    }

    if (this._done) {
      ctx.font = `8px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ENTER TO CONTINUE', CANVAS_W / 2, CANVAS_H - 30);
    }
  }
}
