import { audio } from '../engine/AudioManager.js';
import { drawRoundRect } from '../utils/draw.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';
import { AI_ROUND_BONUS, AI_MAX_DIFFICULTY } from '../constants.js';

const ROUND_NAMES = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

export class BracketState {
  constructor(sm) { this._sm = sm; }

  enter(data) {
    this._wc = data.wc;
    this._numPlayers = data.numPlayers || 1;
    this._animT = 0;
  }

  exit() {}

  _getSlots() {
    const np = this._numPlayers;
    if (np === 1) return { left: [0, 0], right: [-1, -1] };
    if (np === 2) return { left: [0, 1], right: [-1, -1] };
    if (np >= 3) return { left: [0, 1], right: [2, 3] };
    return { left: [0, 0], right: [-1, -1] };
  }

  update(dt, input) {
    this._animT += dt;

    if (input.justPressed('Enter') || input.justPressed('Space') || input.justPressed('KeyF')) {
      audio.play('uiConfirm');
      this._playNextMatch();
    }
    if (input.justPressed('Escape')) {
      this._sm.change(this._sm._mainMenuState, {});
    }
  }

  _playNextMatch() {
    const wc = this._wc;

    // Simulate all CPU matches for current round first
    wc.simulateCPUKnockoutMatches();

    const pm = wc.getNextKnockoutPlayerMatch();
    if (!pm) {
      // Player is eliminated or it's done
      if (wc.phase === 'done') {
        this._sm.change(this._sm._resultState, { type: 'champion', wc });
      } else {
        wc._simulateToEnd();
        this._sm.change(this._sm._resultState, { type: 'eliminated_ko', wc });
      }
      return;
    }

    const slots = this._getSlots();
    const playerIsLeft = pm.teamA.id === wc.playerTeamId;
    const leftTeam  = playerIsLeft ? pm.teamA : pm.teamB;
    const rightTeam = playerIsLeft ? pm.teamB : pm.teamA;

    this._sm.push(this._sm._matchState, {
      leftTeam, rightTeam,
      leftSlots:  playerIsLeft ? slots.left  : slots.right,
      rightSlots: playerIsLeft ? slots.right : slots.left,
      roundName: wc.getKnockoutRoundName().toUpperCase(),
      isKnockout: true,
      aiDifficulty: rightTeam.difficulty,
      roundIndex: wc.knockoutRound,
      onMatchEnd: (result) => {
        if (result.needsPenalties) {
          this._sm.push(this._sm._penaltyState, {
            leftTeam, rightTeam,
            leftSlots:  playerIsLeft ? slots.left  : slots.right,
            rightSlots: playerIsLeft ? slots.right : slots.left,
            onEnd: ({ winnerId }) => {
              const scoreA = playerIsLeft ? result.scoreLeft : result.scoreRight;
              const scoreB = playerIsLeft ? result.scoreRight : result.scoreLeft;
              wc.recordKnockoutMatch(pm, scoreA, scoreB, winnerId);
              this._afterMatch(pm, winnerId);
            },
          });
          return;
        }

        const scoreA = playerIsLeft ? result.scoreLeft : result.scoreRight;
        const scoreB = playerIsLeft ? result.scoreRight : result.scoreLeft;
        wc.recordKnockoutMatch(pm, scoreA, scoreB, null);
        this._afterMatch(pm, null);
      },
    });
  }

  _afterMatch(pm, penaltyWinnerId) {
    const wc = this._wc;
    const playerWon = pm.result.winner.id === wc.playerTeamId;

    if (!playerWon) {
      wc._simulateToEnd();
      this._sm.change(this._sm._resultState, { type: 'eliminated_ko', wc, numPlayers: this._numPlayers });
      return;
    }

    // Advance round
    wc.simulateCPUKnockoutMatches();
    const canAdvance = wc.knockoutMatches[wc.knockoutRound].every(m => m && m.result);
    if (canAdvance) {
      wc.advanceKnockoutRound();
    }

    if (wc.phase === 'done') {
      this._sm.change(this._sm._resultState, { type: 'champion', wc, numPlayers: this._numPlayers });
    } else {
      this._sm.change(this, { wc, numPlayers: this._numPlayers });
    }
  }

  render(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    ctx.fillStyle = '#040a04';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.font = `12px ${fontFamily}`;
    ctx.fillStyle = '#ffdf00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#ffdf00';
    ctx.shadowBlur = 8;
    ctx.fillText('KNOCKOUT STAGE', CANVAS_W / 2, 12);
    ctx.shadowBlur = 0;

    ctx.font = `8px ${fontFamily}`;
    ctx.fillStyle = '#00ff88';
    ctx.fillText(ROUND_NAMES[this._wc.knockoutRound]?.toUpperCase() || '', CANVAS_W / 2, 34);

    this._renderMatches(ctx);

    // Player match highlight
    const pm = this._wc.getNextKnockoutPlayerMatch();
    if (pm) {
      ctx.font = `7px ${fontFamily}`;
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`YOUR MATCH: ${pm.teamA.flag}${pm.teamA.code} vs ${pm.teamB.code}${pm.teamB.flag}`, CANVAS_W / 2, CANVAS_H - 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PRESS ENTER TO PLAY', CANVAS_W / 2, CANVAS_H - 14);
    } else if (this._wc.phase === 'done') {
      ctx.font = `10px ${fontFamily}`;
      ctx.fillStyle = '#ffdf00';
      ctx.textAlign = 'center';
      ctx.fillText(`🏆 ${this._wc.champion?.name?.toUpperCase()} WINS! 🏆`, CANVAS_W / 2, CANVAS_H - 20);
    }
  }

  _renderMatches(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    const rounds = this._wc.knockoutMatches;
    if (!rounds) return;

    const roundCount = 4;
    const colW = CANVAS_W / (roundCount + 1);
    const startY = 70;
    const maxMatches = 4; // max in R16 for our 4-match bracket
    const cellH = (CANVAS_H - startY - 60) / maxMatches;

    rounds.forEach((round, ri) => {
      if (!round) return;
      const x = colW * (ri + 0.5);
      const matchesInRound = round.length;
      const totalH = matchesInRound * cellH;
      const offsetY = startY + (maxMatches - matchesInRound) * cellH / 2;

      round.forEach((m, mi) => {
        if (!m) return;
        const y = offsetY + mi * cellH + cellH / 4;
        const isPlayerMatch = m.teamA.id === this._wc.playerTeamId || m.teamB.id === this._wc.playerTeamId;
        const pulse = isPlayerMatch && !m.result ? 0.96 + Math.sin(this._animT * 3) * 0.04 : 1;

        ctx.save();
        ctx.translate(x, y + cellH / 4);
        ctx.scale(pulse, pulse);
        ctx.translate(-x, -(y + cellH / 4));

        const bw = colW - 14;
        const bx = x - bw / 2;
        const by = y;

        drawRoundRect(ctx, bx, by, bw, cellH / 2, 4,
          isPlayerMatch && !m.result ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
          isPlayerMatch && !m.result ? '#00ff88' : (m.result ? '#556655' : '#333'),
        );
        ctx.lineWidth = isPlayerMatch ? 2 : 1;

        // Team A
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(m.teamA.flag, bx + 4, by + 4);
        ctx.font = `6px ${fontFamily}`;
        ctx.fillStyle = m.result?.winner?.id === m.teamA.id ? '#00ff88' : '#ccc';
        ctx.fillText(m.teamA.code, bx + 20, by + 6);

        if (m.result) {
          ctx.textAlign = 'right';
          ctx.fillText(m.result.scoreA, bx + bw - 4, by + 6);
        }

        // Team B
        const bh = cellH / 2;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(m.teamB.flag, bx + 4, by + bh / 2 + 2);
        ctx.font = `6px ${fontFamily}`;
        ctx.fillStyle = m.result?.winner?.id === m.teamB.id ? '#00ff88' : '#ccc';
        ctx.fillText(m.teamB.code, bx + 20, by + bh / 2 + 4);

        if (m.result) {
          ctx.textAlign = 'right';
          ctx.fillText(m.result.scoreB, bx + bw - 4, by + bh / 2 + 4);
        }

        ctx.restore();
      });

      // Round name label
      ctx.font = `6px ${fontFamily}`;
      ctx.fillStyle = '#444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(['R16', 'QF', 'SF', 'FINAL'][ri] || '', x, startY - 10);
    });
  }
}
