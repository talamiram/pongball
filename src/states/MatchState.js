import { Ball } from '../game/Ball.js';
import { Team } from '../game/Team.js';
import { ScoreBoard } from '../game/ScoreBoard.js';
import { ParticleSystem } from '../game/ParticleSystem.js';
import { physicsStep } from '../game/Physics.js';
import { getFieldCanvas } from '../game/Field.js';
import { PaddleAI } from '../tournament/AI.js';
import { audio } from '../engine/AudioManager.js';
import {
  CANVAS_W, CANVAS_H, GOAL_TOP, GOAL_BOTTOM, FIELD_LEFT, FIELD_RIGHT,
  MATCH_DURATION, OT_DURATION, GOAL_PAUSE, KICKOFF_COUNTDOWN,
  AI_ROUND_BONUS, AI_MAX_DIFFICULTY,
} from '../constants.js';
import { drawText } from '../utils/draw.js';

const STATE = {
  COUNTDOWN: 'countdown',
  PLAYING:   'playing',
  GOAL_PAUSE: 'goal_pause',
  FULL_TIME:  'full_time',
  OVERTIME:   'overtime',
  OT_PAUSE:   'ot_pause',
};

export class MatchState {
  constructor(stateManager) {
    this._sm = stateManager;
  }

  /**
   * data: {
   *   leftTeam,        // team data object
   *   rightTeam,       // team data object
   *   leftSlots,       // [gkPlayerIndex, ofPlayerIndex] (-1=AI)
   *   rightSlots,      // same
   *   roundName,       // string like "Group A" or "Quarter-finals"
   *   isKnockout,      // bool — enables OT+penalties
   *   aiDifficulty,    // base difficulty for AI opponents
   *   roundIndex,      // for difficulty scaling
   *   onMatchEnd,      // callback({ scoreLeft, scoreRight, penaltyWinnerId })
   * }
   */
  enter(data) {
    this._data = data;
    const { leftTeam, rightTeam, leftSlots, rightSlots, aiDifficulty = 0.7, roundIndex = 0 } = data;

    this._leftTeam  = new Team(leftTeam,  true,  leftSlots  || [-1, -1]);
    this._rightTeam = new Team(rightTeam, false, rightSlots || [-1, -1]);

    this._ball = new Ball();
    this._particles = new ParticleSystem();
    this._scoreboard = new ScoreBoard();

    this._scoreLeft  = 0;
    this._scoreRight = 0;

    this._timeRemaining = MATCH_DURATION;
    this._phase = 'normal'; // 'normal' | 'ot' | 'penalties'
    this._otRemaining = OT_DURATION;
    this._matchEnded = false;
    this._fullTimeTimer = 2.0;
    this._state = STATE.COUNTDOWN;
    this._countdown = KICKOFF_COUNTDOWN;
    this._goalPauseTimer = 0;
    this._flashTimer = 0;
    this._goalTextTimer = 0;
    this._goalTextSide = null;
    this._serveToLeft = Math.random() < 0.5;

    // AI controllers
    const diff = Math.min(AI_MAX_DIFFICULTY, aiDifficulty + roundIndex * AI_ROUND_BONUS);
    const inactiveDiff = diff * 0.85;

    this._aiGK_left  = new PaddleAI(leftSlots?.[0]  === -1 ? diff : inactiveDiff);
    this._aiOF_left  = new PaddleAI(leftSlots?.[1]  === -1 ? diff : inactiveDiff);
    this._aiGK_right = new PaddleAI(rightSlots?.[0] === -1 ? diff : inactiveDiff);
    this._aiOF_right = new PaddleAI(rightSlots?.[1] === -1 ? diff : inactiveDiff);

    this._ball.reset(this._serveToLeft);
  }

  exit() {}

  update(dt, input) {
    // Check paddle switches
    this._leftTeam.checkSwitch(input);
    this._rightTeam.checkSwitch(input);

    // Global keys
    if (input.justPressed('KeyM')) audio.muted = !audio.muted;
    if (input.justPressed('KeyP') || input.justPressed('Escape')) {
      // Simple pause toggle — TODO: push PauseState if needed
    }

    switch (this._state) {
      case STATE.COUNTDOWN: this._updateCountdown(dt, input); break;
      case STATE.PLAYING:   this._updatePlaying(dt, input);   break;
      case STATE.GOAL_PAUSE: this._updateGoalPause(dt);       break;
      case STATE.FULL_TIME: this._updateFullTime(dt, input);  break;
      case STATE.OT_PAUSE:  this._updateOTPause(dt);          break;
    }
  }

  _updateCountdown(dt, input) {
    this._countdown -= dt;
    if (this._countdown <= 0) {
      this._countdown = 0;
      this._state = STATE.PLAYING;
      this._ball.activate();
      audio.play('whistle');
    } else {
      const tick = Math.ceil(this._countdown);
      if (tick <= 3 && tick >= 1) {
        // Play countdown beep on integer boundaries
        const prev = Math.ceil(this._countdown + dt);
        if (prev > tick) audio.play('countdown');
      }
    }
  }

  _updatePlaying(dt, input) {
    const clock = this._phase === 'ot' ? '_otRemaining' : '_timeRemaining';

    // Move human paddles
    this._movePaddles(dt, input);

    // AI for uncontrolled paddles
    this._runAI(dt);

    // Physics
    const result = physicsStep(
      dt, this._ball,
      this._leftTeam.gk, this._rightTeam.gk,
      this._leftTeam.of, this._rightTeam.of,
    );

    if (result.wallHit) audio.play('wallHit');
    if (result.gkHit || result.ofHit) audio.play('paddleHit');

    if (result.goal) {
      this._handleGoal(result.goal);
      return;
    }

    // Update particle system
    this._particles.update(dt);
    if (this._flashTimer > 0) this._flashTimer -= dt;
    if (this._goalTextTimer > 0) this._goalTextTimer -= dt;

    // Tick clock
    this[clock] -= dt;
    if (this[clock] <= 0) {
      this[clock] = 0;
      this._onTimeUp();
    }
  }

  _movePaddles(dt, input) {
    const lGKAxes = this._leftTeam.getGKAxes(input);
    const lOFAxes = this._leftTeam.getOFAxes(input);
    const rGKAxes = this._rightTeam.getGKAxes(input);
    const rOFAxes = this._rightTeam.getOFAxes(input);

    this._leftTeam.gk.update(dt, lGKAxes);
    this._leftTeam.of.update(dt, lOFAxes);
    this._rightTeam.gk.update(dt, rGKAxes);
    this._rightTeam.of.update(dt, rOFAxes);
  }

  _runAI(dt) {
    const ball = this._ball;
    const lt = this._leftTeam;
    const rt = this._rightTeam;

    if (lt.playerSlots[0] === -1 || (lt.playerSlots[0] === lt.playerSlots[1] && lt.activePaddle !== 'gk')) {
      this._aiGK_left.updateGK(dt, ball, lt.gk);
      this._aiGK_left.moveGK(dt, lt.gk);
    }
    if (lt.playerSlots[1] === -1 || (lt.playerSlots[0] === lt.playerSlots[1] && lt.activePaddle !== 'of')) {
      this._aiOF_left.updateOF(dt, ball, lt.of, true);
      this._aiOF_left.moveOF(dt, lt.of, true);
    }
    if (rt.playerSlots[0] === -1 || (rt.playerSlots[0] === rt.playerSlots[1] && rt.activePaddle !== 'gk')) {
      this._aiGK_right.updateGK(dt, ball, rt.gk);
      this._aiGK_right.moveGK(dt, rt.gk);
    }
    if (rt.playerSlots[1] === -1 || (rt.playerSlots[0] === rt.playerSlots[1] && rt.activePaddle !== 'of')) {
      this._aiOF_right.updateOF(dt, ball, rt.of, false);
      this._aiOF_right.moveOF(dt, rt.of, false);
    }
  }

  _handleGoal(side) {
    // side: 'left' = right team scored (ball went past left goal)
    // side: 'right' = left team scored
    if (side === 'right') {
      this._scoreLeft++;
      this._goalTextSide = 'left';
    } else {
      this._scoreRight++;
      this._goalTextSide = 'right';
    }

    audio.play('goal');
    this._flashTimer = 0.18;
    this._goalTextTimer = 2.0;
    this._state = STATE.GOAL_PAUSE;
    this._goalPauseTimer = GOAL_PAUSE;
    this._serveToLeft = side === 'left'; // serve toward team that conceded

    // Particles at goal mouth
    const goalX = side === 'left' ? FIELD_LEFT + 7 : FIELD_RIGHT - 7;
    const goalY = (GOAL_TOP + GOAL_BOTTOM) / 2;
    const scoringTeam = side === 'right' ? this._leftTeam.data : this._rightTeam.data;
    this._particles.emit(goalX, goalY, 80, [
      scoringTeam.primary, scoringTeam.secondary, '#ffffff', '#ffff00',
    ]);
  }

  _updateGoalPause(dt) {
    this._particles.update(dt);
    if (this._flashTimer > 0) this._flashTimer -= dt;
    if (this._goalTextTimer > 0) this._goalTextTimer -= dt;
    this._goalPauseTimer -= dt;
    if (this._goalPauseTimer <= 0) {
      this._ball.reset(this._serveToLeft);
      this._state = STATE.COUNTDOWN;
      this._countdown = KICKOFF_COUNTDOWN;
    }
  }

  _onTimeUp() {
    audio.play('whistle');
    if (this._scoreLeft !== this._scoreRight || !this._data.isKnockout) {
      this._state = STATE.FULL_TIME;
    } else if (this._phase === 'normal') {
      // Go to overtime
      this._phase = 'ot';
      this._otRemaining = OT_DURATION;
      this._goalPauseTimer = 2.5;
      this._state = STATE.OT_PAUSE;
    } else {
      // OT also tied → penalties
      this._state = STATE.FULL_TIME;
      this._goToPenalties();
    }
  }

  _updateFullTime(dt, input) {
    if (this._matchEnded) return;
    this._fullTimeTimer -= dt;
    if (this._fullTimeTimer <= 0) {
      this._matchEnded = true;
      this._data.onMatchEnd?.({
        scoreLeft: this._scoreLeft,
        scoreRight: this._scoreRight,
        penaltyWinnerId: null,
      });
    }
  }

  _updateOTPause(dt) {
    this._goalPauseTimer -= dt;
    if (this._goalPauseTimer <= 0) {
      this._ball.reset(this._serveToLeft);
      this._state = STATE.COUNTDOWN;
      this._countdown = KICKOFF_COUNTDOWN;
    }
  }

  _goToPenalties() {
    this._data.onMatchEnd?.({
      scoreLeft: this._scoreLeft,
      scoreRight: this._scoreRight,
      needsPenalties: true,
    });
  }

  render(ctx) {
    // Field
    ctx.drawImage(getFieldCanvas(), 0, 0);

    // Flash overlay on goal
    if (this._flashTimer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this._flashTimer * 4})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Paddles
    this._leftTeam.gk.render(ctx);
    this._leftTeam.of.render(ctx);
    this._rightTeam.gk.render(ctx);
    this._rightTeam.of.render(ctx);

    // Ball
    this._ball.render(ctx);

    // Particles
    this._particles.render(ctx);

    // Scoreboard
    const isOT = this._phase === 'ot';
    this._scoreboard.render(
      ctx,
      this._leftTeam.data, this._rightTeam.data,
      this._scoreLeft, this._scoreRight,
      isOT ? this._otRemaining : this._timeRemaining,
      this._data.roundName || '',
      this._phase,
      isOT ? this._otRemaining : null,
    );

    // Countdown overlay
    if (this._state === STATE.COUNTDOWN && this._countdown > 0) {
      this._renderCountdown(ctx);
    }

    // Goal text
    if (this._goalTextTimer > 0) {
      this._renderGoalText(ctx);
    }

    // OT banner
    if (this._state === STATE.OT_PAUSE) {
      this._renderBanner(ctx, 'EXTRA TIME!', '#ffaa00');
    }

    // Full time banner
    if (this._state === STATE.FULL_TIME) {
      this._renderBanner(ctx, 'FULL TIME', '#ffffff');
    }

    // Controls hint (first 5 seconds)
    if (this._timeRemaining > MATCH_DURATION - 5 && this._phase === 'normal') {
      this._renderControlsHint(ctx);
    }
  }

  _renderCountdown(ctx) {
    const tick = Math.ceil(this._countdown);
    const label = tick > 0 ? String(tick) : 'GO!';
    const alpha = Math.min(1, this._countdown % 1 + 0.3);
    const fontFamily = "'Press Start 2P', monospace";

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `48px ${fontFamily}`;
    ctx.fillStyle = tick <= 0 ? '#00ff88' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.fillText(label, CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }

  _renderGoalText(ctx) {
    const alpha = Math.min(1, this._goalTextTimer);
    const fontFamily = "'Press Start 2P', monospace";
    const team = this._goalTextSide === 'left' ? this._leftTeam.data : this._rightTeam.data;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `28px ${fontFamily}`;
    ctx.fillStyle = team.primary;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('GOAL!', CANVAS_W / 2, CANVAS_H / 2 - 30);
    ctx.fillText('GOAL!', CANVAS_W / 2, CANVAS_H / 2 - 30);

    ctx.font = `11px ${fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(team.name.toUpperCase(), CANVAS_W / 2, CANVAS_H / 2 + 4);
    ctx.restore();
  }

  _renderBanner(ctx, text, color) {
    const fontFamily = "'Press Start 2P', monospace";
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, CANVAS_H / 2 - 40, CANVAS_W, 80);
    ctx.font = `22px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }

  _renderControlsHint(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.font = `6px ${fontFamily}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('CAPSLOCK = switch paddle  |  M = mute', CANVAS_W / 2, CANVAS_H - 6);
    ctx.restore();
  }
}
