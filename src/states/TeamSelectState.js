import { TEAMS } from '../tournament/teams.js';
import { audio } from '../engine/AudioManager.js';
import { drawRoundRect } from '../utils/draw.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';

const COLS = 4;
const ROWS = 4;
const CARD_W = 180;
const CARD_H = 88;
const GAP = 10;
const GRID_W = COLS * CARD_W + (COLS - 1) * GAP;
const GRID_X = (CANVAS_W - GRID_W) / 2;
const GRID_Y = 110;

export class TeamSelectState {
  constructor(sm) { this._sm = sm; }

  enter(data) {
    this._numPlayers = data.numPlayers || 1;
    this._cursor = 0;
    this._selected = -1;
    this._animT = 0;
  }

  exit() {}

  update(dt, input) {
    this._animT += dt;

    const cols = COLS, rows = ROWS;
    const total = TEAMS.length;

    if (input.justPressed('ArrowLeft') || input.justPressed('KeyA')) {
      this._cursor = (this._cursor - 1 + total) % total;
      audio.play('uiClick');
    }
    if (input.justPressed('ArrowRight') || input.justPressed('KeyD')) {
      this._cursor = (this._cursor + 1) % total;
      audio.play('uiClick');
    }
    if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
      this._cursor = (this._cursor - cols + total) % total;
      audio.play('uiClick');
    }
    if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
      this._cursor = (this._cursor + cols) % total;
      audio.play('uiClick');
    }

    if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyF')) {
      audio.play('uiConfirm');
      const team = TEAMS[this._cursor];
      this._sm.change(this._sm._groupDrawState, {
        playerTeamId: team.id,
        numPlayers: this._numPlayers,
      });
    }

    if (input.justPressed('Escape')) {
      this._sm.change(this._sm._mainMenuState, {});
    }
  }

  render(ctx) {
    const fontFamily = "'Press Start 2P', monospace";

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    ctx.font = `12px ${fontFamily}`;
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText('SELECT YOUR TEAM', CANVAS_W / 2, 20);
    ctx.shadowBlur = 0;

    ctx.font = `7px ${fontFamily}`;
    ctx.fillStyle = '#556655';
    ctx.fillText('ARROWS TO NAVIGATE   ENTER TO CONFIRM', CANVAS_W / 2, 42);
    ctx.fillText(`MODE: ${['1 PLAYER', '2 PLAYERS', '4 PLAYERS'][this._numPlayers - 1]}`, CANVAS_W / 2, 56);

    TEAMS.forEach((team, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = GRID_X + col * (CARD_W + GAP);
      const y = GRID_Y + row * (CARD_H + GAP);
      const isHovered = i === this._cursor;
      const pulse = isHovered ? 0.92 + Math.sin(this._animT * 4) * 0.08 : 1;

      ctx.save();
      ctx.translate(x + CARD_W / 2, y + CARD_H / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(-(CARD_W / 2), -(CARD_H / 2));

      // Card background
      drawRoundRect(ctx, 0, 0, CARD_W, CARD_H, 8,
        isHovered ? `${team.primary}33` : 'rgba(255,255,255,0.04)',
        isHovered ? team.primary : '#2a2a2a',
      );
      ctx.lineWidth = isHovered ? 2 : 1;

      // Flag emoji
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(team.flag, CARD_W / 2, CARD_H / 2 - 10);

      // Team code
      ctx.font = `8px ${fontFamily}`;
      ctx.fillStyle = isHovered ? '#ffffff' : '#888';
      ctx.fillText(team.code, CARD_W / 2, CARD_H / 2 + 20);

      // Difficulty stars
      const stars = Math.round(team.difficulty * 5);
      ctx.font = `7px sans-serif`;
      ctx.fillStyle = isHovered ? '#ffdf00' : '#444';
      let starStr = '';
      for (let s = 0; s < 5; s++) starStr += s < stars ? '★' : '☆';
      ctx.fillText(starStr, CARD_W / 2, CARD_H / 2 + 34);

      ctx.restore();
    });

    // Selected team preview
    const team = TEAMS[this._cursor];
    ctx.font = `9px ${fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(team.name.toUpperCase(), CANVAS_W / 2, CANVAS_H - 12);
  }
}
