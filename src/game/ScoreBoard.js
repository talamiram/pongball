import { CANVAS_W, HUD_H, FONT_MD, FONT_LG, FONT_SM } from '../constants.js';
import { drawText } from '../utils/draw.js';

export class ScoreBoard {
  render(ctx, leftTeam, rightTeam, scoreLeft, scoreRight, timeRemaining, roundName, phase, overtimeActive) {
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_W, HUD_H);

    // Bottom border
    ctx.fillStyle = '#333';
    ctx.fillRect(0, HUD_H - 2, CANVAS_W, 2);

    const midX = CANVAS_W / 2;
    const fontFamily = "'Press Start 2P', monospace";

    // Left team block
    this._drawTeamBlock(ctx, leftTeam, 20, HUD_H / 2, 'left');

    // Right team block
    this._drawTeamBlock(ctx, rightTeam, CANVAS_W - 20, HUD_H / 2, 'right');

    // Score
    ctx.font = `${FONT_LG + 6}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#fff';
    ctx.fillText(`${scoreLeft}`, midX - 36, HUD_H / 2);
    ctx.fillStyle = '#888';
    ctx.font = `${FONT_MD}px ${fontFamily}`;
    ctx.fillText('-', midX, HUD_H / 2);
    ctx.fillStyle = '#fff';
    ctx.font = `${FONT_LG + 6}px ${fontFamily}`;
    ctx.fillText(`${scoreRight}`, midX + 36, HUD_H / 2);

    // Time / round
    const mins = Math.ceil(timeRemaining);
    const timeStr = overtimeActive ? `90+${Math.ceil(overtimeActive)}'` : `${Math.min(90, Math.ceil((90 / (phase === 'ot' ? 30 : 90)) * timeRemaining))}'`;
    ctx.font = `${FONT_SM}px ${fontFamily}`;
    ctx.fillStyle = overtimeActive ? '#ffaa00' : '#aaaaaa';
    ctx.fillText(timeStr, midX, HUD_H / 2 + 16);

    // Round name (top center, tiny)
    if (roundName) {
      ctx.font = `6px ${fontFamily}`;
      ctx.fillStyle = '#666';
      ctx.fillText(roundName.toUpperCase(), midX, 9);
    }
  }

  _drawTeamBlock(ctx, team, x, y, align) {
    if (!team) return;
    const fontFamily = "'Press Start 2P', monospace";

    // Flag emoji
    ctx.font = '22px sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const flagX = align === 'left' ? x : x;
    ctx.fillText(team.flag, flagX, y - 6);

    // Team code
    ctx.font = `7px ${fontFamily}`;
    ctx.fillStyle = '#ccc';
    ctx.textAlign = align;
    ctx.fillText(team.code, flagX, y + 14);
  }
}
