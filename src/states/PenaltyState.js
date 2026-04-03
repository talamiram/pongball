import { audio } from '../engine/AudioManager.js';
import { ParticleSystem } from '../game/ParticleSystem.js';
import { drawText, drawSoccerBall, drawJersey } from '../utils/draw.js';
import { clamp } from '../utils/math.js';
import { CANVAS_W, CANVAS_H } from '../constants.js';

const KICKS_PER_SIDE = 5;
const GOAL_W_PX = 400;
const GOAL_H_PX = 200;
const GOAL_X = (CANVAS_W - GOAL_W_PX) / 2;
const GOAL_Y = CANVAS_H / 2 - GOAL_H_PX / 2 - 20;
const BALL_START_Y = GOAL_Y + GOAL_H_PX + 80;
const BALL_START_X = CANVAS_W / 2;

const SUB = { AIMING: 'aiming', SHOT: 'shot', RESULT: 'result', DONE: 'done' };

export class PenaltyState {
  constructor(sm) { this._sm = sm; }

  enter(data) {
    this._data = data;
    // data: { leftTeam, rightTeam, leftSlots, rightSlots, onEnd }
    this._kicksLeft  = [];
    this._kicksRight = [];
    this._currentSide = 'left'; // who's kicking now
    this._kickNum = 0;           // 0-based total kick index
    this._sub = SUB.AIMING;

    this._aimY = CANVAS_H / 2; // shooter aim position
    this._aimX = CANVAS_W / 2;
    this._aimTimer = 0;
    this._aimDir = 1;            // oscillate aim
    this._shootTimer = 0;
    this._ballX = BALL_START_X;
    this._ballY = BALL_START_Y;
    this._ballVX = 0;
    this._ballVY = 0;
    this._gkDiveDir = 0;         // -1 left, 0 center, 1 right
    this._gkDiveX = 0;
    this._resultText = '';
    this._resultTimer = 0;
    this._particles = new ParticleSystem();
    this._suddenDeath = false;

    this._shooterIsHuman = this._isHuman(this._currentSide);
    this._gkIsHuman = this._isGKHuman(this._currentSide === 'left' ? 'right' : 'left');
  }

  exit() {}

  _isHuman(side) {
    const slots = side === 'left' ? this._data.leftSlots : this._data.rightSlots;
    return slots && slots.some(s => s !== -1);
  }

  _isGKHuman(side) {
    const slots = side === 'left' ? this._data.leftSlots : this._data.rightSlots;
    return slots && slots[0] !== -1;
  }

  _getShooterPlayerIndex() {
    const slots = this._currentSide === 'left' ? this._data.leftSlots : this._data.rightSlots;
    return slots ? (slots[1] !== -1 ? slots[1] : slots[0]) : -1;
  }

  _getGKPlayerIndex() {
    const defSide = this._currentSide === 'left' ? 'right' : 'left';
    const slots = defSide === 'left' ? this._data.leftSlots : this._data.rightSlots;
    return slots ? slots[0] : -1;
  }

  update(dt, input) {
    this._particles.update(dt);

    switch (this._sub) {
      case SUB.AIMING:  this._updateAiming(dt, input);  break;
      case SUB.SHOT:    this._updateShot(dt, input);    break;
      case SUB.RESULT:  this._updateResult(dt);         break;
      case SUB.DONE:    break;
    }
  }

  _updateAiming(dt, input) {
    const shooterPi = this._getShooterPlayerIndex();
    const gkPi = this._getGKPlayerIndex();
    const shooterHuman = shooterPi !== -1;
    const gkHuman = gkPi !== -1;

    if (shooterHuman) {
      // Human controls aim with their direction keys
      const axes = input.getAxes(shooterPi);
      if (axes.up)   this._aimY = clamp(this._aimY - 220 * dt, GOAL_Y + 20, GOAL_Y + GOAL_H_PX - 20);
      if (axes.down) this._aimY = clamp(this._aimY + 220 * dt, GOAL_Y + 20, GOAL_Y + GOAL_H_PX - 20);
      if (axes.left) this._aimX = clamp(this._aimX - 220 * dt, GOAL_X + 20, GOAL_X + GOAL_W_PX - 20);
      if (axes.right)this._aimX = clamp(this._aimX + 220 * dt, GOAL_X + 20, GOAL_X + GOAL_W_PX - 20);

      // Shoot with action key or direction release
      if (input.justAction(shooterPi)) {
        this._shoot();
      }
    } else {
      // AI aims: random target with slight delay
      this._aimTimer += dt;
      if (this._aimTimer > 1.2) {
        this._aimX = GOAL_X + 30 + Math.random() * (GOAL_W_PX - 60);
        this._aimY = GOAL_Y + 20 + Math.random() * (GOAL_H_PX - 40);
        this._shoot();
      }
    }
  }

  _shoot() {
    const dx = this._aimX - BALL_START_X;
    const dy = this._aimY - BALL_START_Y;
    const dist = Math.hypot(dx, dy);
    const speed = 900;
    this._ballVX = (dx / dist) * speed;
    this._ballVY = (dy / dist) * speed;
    this._ballX = BALL_START_X;
    this._ballY = BALL_START_Y;
    this._sub = SUB.SHOT;
    this._shootTimer = 0;
    audio.play('penaltyKick');

    // GK decides where to dive
    const gkPi = this._getGKPlayerIndex();
    if (gkPi !== -1) {
      // will be read each frame in _updateShot
      this._gkHumanDiveDecided = false;
    } else {
      // AI GK: random dive
      const r = Math.random();
      const aimRelX = (this._aimX - GOAL_X) / GOAL_W_PX; // 0–1
      // AI has imperfect read based on difficulty
      const diff = 0.7;
      const rand = Math.random();
      if (rand < diff) {
        this._gkDiveDir = aimRelX < 0.4 ? -1 : aimRelX > 0.6 ? 1 : 0;
      } else {
        this._gkDiveDir = [-1, 0, 1][Math.floor(Math.random() * 3)];
      }
      this._gkDiveX = this._gkDiveDir === -1 ? GOAL_X + 30 :
                      this._gkDiveDir === 1  ? GOAL_X + GOAL_W_PX - 30 : GOAL_X + GOAL_W_PX / 2;
      this._gkHumanDiveDecided = true;
    }
  }

  _updateShot(dt, input) {
    this._shootTimer += dt;

    const gkPi = this._getGKPlayerIndex();
    if (!this._gkHumanDiveDecided && gkPi !== -1) {
      const axes = input.getAxes(gkPi);
      if (axes.left)  { this._gkDiveDir = -1; this._gkDiveX = GOAL_X + 30; this._gkHumanDiveDecided = true; }
      if (axes.right) { this._gkDiveDir =  1; this._gkDiveX = GOAL_X + GOAL_W_PX - 30; this._gkHumanDiveDecided = true; }
      if (this._shootTimer > 0.3 && !this._gkHumanDiveDecided) {
        this._gkDiveDir = 0;
        this._gkDiveX = GOAL_X + GOAL_W_PX / 2;
        this._gkHumanDiveDecided = true;
      }
    }

    this._ballX += this._ballVX * dt;
    this._ballY += this._ballVY * dt;

    // Check if ball reached the goal line area
    if (this._ballY <= GOAL_Y + GOAL_H_PX && this._shootTimer > 0.15) {
      this._resolvePenalty();
    }
  }

  _resolvePenalty() {
    const inGoal = this._ballX > GOAL_X && this._ballX < GOAL_X + GOAL_W_PX &&
                   this._ballY > GOAL_Y && this._ballY < GOAL_Y + GOAL_H_PX;

    // GK save: ball and GK dive in same horizontal zone
    const ballZone = this._ballX < GOAL_X + GOAL_W_PX * 0.4 ? -1 :
                     this._ballX > GOAL_X + GOAL_W_PX * 0.6 ?  1 : 0;
    const saved = inGoal && (this._gkDiveDir === ballZone);

    const scored = inGoal && !saved;
    const kicker = this._currentSide;

    if (scored) {
      if (kicker === 'left')  this._kicksLeft.push(1);
      else                    this._kicksRight.push(1);
      this._resultText = 'GOAL!';
      audio.play('goal');
      const team = kicker === 'left' ? this._data.leftTeam : this._data.rightTeam;
      this._particles.emit(this._ballX, this._ballY, 60, [team.primary, team.secondary, '#fff', '#ff0']);
    } else {
      if (kicker === 'left')  this._kicksLeft.push(0);
      else                    this._kicksRight.push(0);
      this._resultText = saved ? 'SAVED!' : 'MISS!';
      audio.play('penaltySave');
    }

    this._sub = SUB.RESULT;
    this._resultTimer = 1.8;
    this._advanceKick();
  }

  _advanceKick() {
    // Alternate sides
    this._currentSide = this._currentSide === 'left' ? 'right' : 'left';
    this._kickNum++;

    // Check if shootout is decided
    const leftScored = this._kicksLeft.reduce((a, b) => a + b, 0);
    const rightScored = this._kicksRight.reduce((a, b) => a + b, 0);
    const leftDone = this._kicksLeft.length;
    const rightDone = this._kicksRight.length;

    const maxLeft = KICKS_PER_SIDE - leftDone;
    const maxRight = KICKS_PER_SIDE - rightDone;

    // Early win check
    if (leftDone >= KICKS_PER_SIDE && rightDone >= KICKS_PER_SIDE) {
      if (leftScored !== rightScored) {
        this._finishShootout(leftScored > rightScored ? 'left' : 'right');
        return;
      } else {
        this._suddenDeath = true;
      }
    }

    if (!this._suddenDeath) {
      const totalKicks = leftDone + rightDone;
      if (leftScored + maxLeft < rightScored) { this._finishShootout('right'); return; }
      if (rightScored + maxRight < leftScored) { this._finishShootout('left'); return; }
    } else {
      // Sudden death: after each pair of kicks, check
      if (leftDone === rightDone && leftDone > KICKS_PER_SIDE) {
        if (leftScored !== rightScored) {
          this._finishShootout(leftScored > rightScored ? 'left' : 'right');
          return;
        }
      }
    }
  }

  _finishShootout(winningSide) {
    const winnerId = winningSide === 'left' ? this._data.leftTeam.id : this._data.rightTeam.id;
    setTimeout(() => {
      this._data.onEnd?.({ winnerId });
    }, 2000);
    this._sub = SUB.DONE;
  }

  _updateResult(dt) {
    this._resultTimer -= dt;
    if (this._resultTimer <= 0 && this._sub !== SUB.DONE) {
      this._resetForNextKick();
    }
  }

  _resetForNextKick() {
    if (this._sub === SUB.DONE) return;
    this._ballX = BALL_START_X;
    this._ballY = BALL_START_Y;
    this._aimX = CANVAS_W / 2;
    this._aimY = GOAL_Y + GOAL_H_PX / 2;
    this._aimTimer = 0;
    this._gkHumanDiveDecided = false;
    this._gkDiveDir = 0;
    this._resultText = '';
    this._sub = SUB.AIMING;
  }

  render(ctx) {
    // Dark background
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw goal
    this._drawGoal(ctx);

    // Draw GK
    this._drawGK(ctx);

    // Draw aim indicator
    if (this._sub === SUB.AIMING) {
      ctx.save();
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(BALL_START_X, BALL_START_Y);
      ctx.lineTo(this._aimX, this._aimY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,0,0.35)';
      ctx.beginPath();
      ctx.arc(this._aimX, this._aimY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw ball
    drawSoccerBall(ctx, this._ballX, this._ballY, 14);

    // Particles
    this._particles.render(ctx);

    // Result text
    if (this._resultText) {
      const fontFamily = "'Press Start 2P', monospace";
      ctx.save();
      ctx.font = `32px ${fontFamily}`;
      ctx.fillStyle = this._resultText === 'GOAL!' ? '#00ff88' : '#ff4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.fillText(this._resultText, CANVAS_W / 2, GOAL_Y - 40);
      ctx.restore();
    }

    // Scoreboard
    this._drawPenaltyScore(ctx);

    // Instructions
    if (this._sub === SUB.AIMING) {
      this._drawInstructions(ctx);
    }
  }

  _drawGoal(ctx) {
    // Net
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(GOAL_X, GOAL_Y, GOAL_W_PX, GOAL_H_PX);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 3;
    ctx.strokeRect(GOAL_X, GOAL_Y, GOAL_W_PX, GOAL_H_PX);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.5;
    for (let x = GOAL_X + 20; x < GOAL_X + GOAL_W_PX; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, GOAL_Y); ctx.lineTo(x, GOAL_Y + GOAL_H_PX); ctx.stroke();
    }
    for (let y = GOAL_Y + 20; y < GOAL_Y + GOAL_H_PX; y += 20) {
      ctx.beginPath(); ctx.moveTo(GOAL_X, y); ctx.lineTo(GOAL_X + GOAL_W_PX, y); ctx.stroke();
    }

    // Ground line
    ctx.fillStyle = '#1a6e28';
    ctx.fillRect(GOAL_X - 60, GOAL_Y + GOAL_H_PX, GOAL_W_PX + 120, 8);
    ctx.fillStyle = '#fff';
    ctx.fillRect(GOAL_X + GOAL_W_PX / 2 - 30, GOAL_Y + GOAL_H_PX, 60, 4);
  }

  _drawGK(ctx) {
    const defSide = this._currentSide === 'left' ? 'right' : 'left';
    const team = defSide === 'left' ? this._data.leftTeam : this._data.rightTeam;

    let gkX = GOAL_X + GOAL_W_PX / 2;
    if (this._gkHumanDiveDecided || this._sub === SUB.SHOT || this._sub === SUB.RESULT) {
      gkX = this._gkDiveX;
    }
    const gkY = GOAL_Y + GOAL_H_PX / 2;
    drawJersey(ctx, gkX, gkY, 30, 55, team.primary, team.secondary, team.code);
  }

  _drawPenaltyScore(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, 52);

    // Team names
    ctx.font = `8px ${fontFamily}`;
    ctx.textBaseline = 'middle';

    ctx.fillStyle = this._data.leftTeam.primary;
    ctx.textAlign = 'left';
    ctx.fillText(this._data.leftTeam.name.toUpperCase(), 20, 20);

    ctx.fillStyle = this._data.rightTeam.primary;
    ctx.textAlign = 'right';
    ctx.fillText(this._data.rightTeam.name.toUpperCase(), CANVAS_W - 20, 20);

    // Kick dots
    const dotR = 7;
    const dotSpacing = 20;
    const dotsStartX = CANVAS_W / 2 - (KICKS_PER_SIDE * dotSpacing) / 2;

    for (let i = 0; i < KICKS_PER_SIDE; i++) {
      const lk = this._kicksLeft[i];
      const rk = this._kicksRight[i];
      const xL = dotsStartX - i * dotSpacing - 30;
      const xR = CANVAS_W - dotsStartX + i * dotSpacing + 30;

      ctx.beginPath(); ctx.arc(xL, 36, dotR, 0, Math.PI * 2);
      ctx.fillStyle = lk === undefined ? '#444' : lk ? '#00ff88' : '#ff4444';
      ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

      ctx.beginPath(); ctx.arc(xR, 36, dotR, 0, Math.PI * 2);
      ctx.fillStyle = rk === undefined ? '#444' : rk ? '#00ff88' : '#ff4444';
      ctx.fill(); ctx.stroke();
    }

    // Scores
    const lScored = this._kicksLeft.reduce((a, b) => a + b, 0);
    const rScored = this._kicksRight.reduce((a, b) => a + b, 0);
    ctx.font = `18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${lScored} - ${rScored}`, CANVAS_W / 2, 36);

    if (this._suddenDeath) {
      ctx.font = `7px ${fontFamily}`;
      ctx.fillStyle = '#ff0';
      ctx.fillText('SUDDEN DEATH', CANVAS_W / 2, 50);
    }

    ctx.restore();
  }

  _drawInstructions(ctx) {
    const fontFamily = "'Press Start 2P', monospace";
    const shooterHuman = this._getShooterPlayerIndex() !== -1;
    const gkHuman = this._getGKPlayerIndex() !== -1;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.font = `6px ${fontFamily}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    const kicker = this._currentSide === 'left' ? this._data.leftTeam.name : this._data.rightTeam.name;
    ctx.fillText(`${kicker.toUpperCase()} KICKS`, CANVAS_W / 2, CANVAS_H - 40);

    if (shooterHuman) {
      ctx.fillText('ARROWS/WASD to aim  |  F/ENTER to shoot', CANVAS_W / 2, CANVAS_H - 28);
    }
    if (gkHuman) {
      ctx.fillText('← → to dive', CANVAS_W / 2, CANVAS_H - 16);
    }
    ctx.restore();
  }
}
