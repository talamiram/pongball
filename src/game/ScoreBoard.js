import { CANVAS_W, HUD_H, FONT_MD, FONT_LG, FONT_SM } from '../constants.js';

export class ScoreBoard {
  render(ctx, leftTeam, rightTeam, scoreLeft, scoreRight, timeRemaining, roundName, phase, overtimeActive) {
    const midX = CANVAS_W / 2;
    const fontFamily = "'Press Start 2P', monospace";

    // Score — big and centered
    ctx.font = `${FONT_LG + 4}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${scoreLeft}  -  ${scoreRight}`, midX, HUD_H / 2);

    // Left team name
    if (leftTeam) {
      ctx.font = `${FONT_SM}px ${fontFamily}`;
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText(leftTeam.code || '', 16, HUD_H / 2);
    }

    // Right team name
    if (rightTeam) {
      ctx.font = `${FONT_SM}px ${fontFamily}`;
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'right';
      ctx.fillText(rightTeam.code || '', CANVAS_W - 16, HUD_H / 2);
    }
  }
}
