import { audio } from '../engine/AudioManager.js';
import { drawRoundRect } from '../utils/draw.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { AI_ROUND_BONUS } from '../constants.js';

export class GroupStageState {
  constructor(sm) { this._sm = sm; }

  enter(data) {
    this._wc = data.wc;
    this._numPlayers = data.numPlayers || 1;
    this._playerTeamId = this._wc.playerTeamId;
    this._nextMatch = null;
    this._showingResults = false;
    this._findNextMatch();
  }

  exit() {}

  _findNextMatch() {
    this._nextMatch = this._wc.getNextPlayerGroupMatch();
  }

  _getSlots() {
    const np = this._numPlayers;
    if (np === 1) return { left: [0, 0], right: [-1, -1] };
    if (np === 2) return { left: [0, 1], right: [-1, -1] };
    if (np >= 3) return { left: [0, 1], right: [2, 3] };
    return { left: [0, 0], right: [-1, -1] };
  }

  update(dt, input) {
    if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyF')) {
      if (this._nextMatch) {
        audio.play('uiConfirm');
        this._startNextMatch();
      } else if (this._wc.isGroupStageComplete()) {
        audio.play('uiConfirm');
        // Check if player advanced
        const standings = this._wc.getSortedStandings(0);
        const playerPos = standings.findIndex(r => r.team.id === this._playerTeamId);
        if (playerPos >= 2) {
          // Eliminated in group stage
          this._sm.change(this._sm._resultState, {
            type: 'eliminated_group',
            wc: this._wc,
            numPlayers: this._numPlayers,
          });
        } else {
          this._wc.buildKnockoutBracket();
          this._sm.change(this._sm._bracketState, {
            wc: this._wc,
            numPlayers: this._numPlayers,
          });
        }
      }
    }
    if (input.justPressed('Escape')) {
      this._sm.change(this._sm._mainMenuState, {});
    }
  }

  _startNextMatch() {
    if (!this._nextMatch) return;
    const m = this._nextMatch;
    const slots = this._getSlots();

    // Determine which side player is on
    const playerIsLeft = m.teamA.id === this._playerTeamId;
    const leftTeam  = playerIsLeft ? m.teamA : m.teamB;
    const rightTeam = playerIsLeft ? m.teamB : m.teamA;
    const leftSlots  = playerIsLeft ? slots.left  : slots.right;
    const rightSlots = playerIsLeft ? slots.right : slots.left;

    this._sm.push(this._sm._matchState, {
      leftTeam, rightTeam,
      leftSlots, rightSlots,
      roundName: 'GROUP STAGE',
      isKnockout: false,
      aiDifficulty: rightTeam.difficulty,
      roundIndex: 0,
      onMatchEnd: (result) => {
        const scoreA = playerIsLeft ? result.scoreLeft : result.scoreRight;
        const scoreB = playerIsLeft ? result.scoreRight : result.scoreLeft;
        this._wc.recordPlayerGroupMatch(m, scoreA, scoreB);
        for (let gi = 0; gi < 4; gi++) this._wc.simulateCPUGroupMatches(gi);
        this._sm.change(this._sm._groupStageState, { wc: this._wc, numPlayers: this._numPlayers });
      },
    });
  }

  render(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    ctx.font = `11px ${fontFamily}`;
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GROUP STAGE', CANVAS_W / 2, 16);

    // Group A standings (player's group)
    this._renderGroupTable(ctx, 0, 20, 80);

    // Other groups
    this._renderGroupTable(ctx, 1, CANVAS_W / 2 + 10, 80);
    this._renderGroupTable(ctx, 2, 20, 280);
    this._renderGroupTable(ctx, 3, CANVAS_W / 2 + 10, 280);

    // Next match info
    const nm = this._nextMatch;
    if (nm) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,255,136,0.1)';
      ctx.fillRect(0, CANVAS_H - 90, CANVAS_W, 90);
      ctx.font = `7px ${fontFamily}`;
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR NEXT MATCH', CANVAS_W / 2, CANVAS_H - 76);

      ctx.font = `10px ${fontFamily}`;
      ctx.fillStyle = '#fff';
      ctx.fillText(`${nm.teamA.flag} ${nm.teamA.code}  vs  ${nm.teamB.code} ${nm.teamB.flag}`, CANVAS_W / 2, CANVAS_H - 56);

      ctx.font = `7px ${fontFamily}`;
      ctx.fillStyle = '#00ff88';
      ctx.fillText('PRESS ENTER TO PLAY', CANVAS_W / 2, CANVAS_H - 34);
      ctx.restore();
    } else if (this._wc.isGroupStageComplete()) {
      ctx.font = `8px ${fontFamily}`;
      ctx.fillStyle = '#ffdf00';
      ctx.textAlign = 'center';
      ctx.fillText('GROUP STAGE COMPLETE!  PRESS ENTER', CANVAS_W / 2, CANVAS_H - 24);
    }
  }

  _renderGroupTable(ctx, groupIndex, x, y) {
    const fontFamily = "'Press Start 2P', monospace";
    const standings = this._wc.getSortedStandings(groupIndex);
    const groupName = ['A', 'B', 'C', 'D'][groupIndex];
    const colW = CANVAS_W / 2 - 30;
    const rowH = 36;

    ctx.font = `8px ${fontFamily}`;
    ctx.fillStyle = '#ffdf00';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`GROUP ${groupName}`, x + 4, y);

    // Header
    ctx.font = `6px ${fontFamily}`;
    ctx.fillStyle = '#555';
    ctx.fillText('TEAM', x + 4, y + 16);
    ctx.textAlign = 'right';
    ctx.fillText('P W D L GD PTS', x + colW - 4, y + 16);

    standings.forEach((row, i) => {
      const ry = y + 30 + i * rowH;
      const isPlayer = row.team.id === this._playerTeamId;
      const qualifies = i < 2;

      // Row background
      ctx.fillStyle = isPlayer
        ? 'rgba(0,255,136,0.12)'
        : qualifies ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0)';
      ctx.fillRect(x, ry, colW, rowH - 2);

      // Flag
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.team.flag, x + 4, ry + rowH / 2 - 1);

      // Code
      ctx.font = `7px ${fontFamily}`;
      ctx.fillStyle = isPlayer ? '#00ff88' : '#ccc';
      ctx.textAlign = 'left';
      ctx.fillText(row.team.code, x + 24, ry + rowH / 2 - 1);

      // Stats
      const gd = row.gf - row.ga;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#aaa';
      ctx.fillText(
        `${row.played} ${row.won} ${row.drawn} ${row.lost} ${gd >= 0 ? '+' : ''}${gd} ${row.pts}`,
        x + colW - 4, ry + rowH / 2 - 1,
      );
    });
  }
}
