import { clamp, lerp, randomRange } from '../utils/math.js';
import {
  FIELD_TOP, FIELD_BOTTOM,
  GK_SPEED, OF_SPEED,
  CANVAS_W,
  LEFT_GK_X, RIGHT_GK_X, LEFT_OF_X, RIGHT_OF_X,
  LEFT_OF_XMIN, LEFT_OF_XMAX, RIGHT_OF_XMIN, RIGHT_OF_XMAX,
  GK_W, GK_H, OF_W, OF_H,
  GK_YMIN, GK_YMAX, OF_YMIN, OF_YMAX,
  FIELD_MID_Y,
} from '../constants.js';

/**
 * AI controller for a single paddle (GK or outfield).
 * difficulty: 0–1
 */
export class PaddleAI {
  constructor(difficulty = 0.7) {
    this.difficulty = difficulty;
    this._reactionTimer = 0;
    this._targetY = FIELD_MID_Y;
    this._targetX = null; // only used for outfield
  }

  /** Update AI target for a Goalkeeper */
  updateGK(dt, ball, gk) {
    this._reactionTimer += dt;
    const interval = lerp(0.22, 0.03, this.difficulty);
    if (this._reactionTimer < interval) return;
    this._reactionTimer = 0;

    const predictedY = this._predictBallY(ball, gk.x + GK_W / 2);
    const error = lerp(65, 4, this.difficulty);
    this._targetY = predictedY + randomRange(-error, error);
    this._targetY = clamp(this._targetY, GK_YMIN + GK_H / 2, GK_YMAX + GK_H / 2);
  }

  moveGK(dt, gk) {
    const speed = lerp(180, GK_SPEED, this.difficulty);
    const centerY = gk.y + GK_H / 2;
    const dy = this._targetY - centerY;
    const step = clamp(dy, -speed * dt, speed * dt);
    gk.y = clamp(gk.y + step, GK_YMIN, GK_YMAX);
  }

  /** Update AI target for an Outfield player */
  updateOF(dt, ball, of_, isLeft) {
    this._reactionTimer += dt;
    const interval = lerp(0.20, 0.03, this.difficulty);
    if (this._reactionTimer < interval) return;
    this._reactionTimer = 0;

    const error = lerp(60, 4, this.difficulty);

    // If ball is coming our way, intercept; otherwise sit at default position
    const ballComingToUs = isLeft ? ball.vx < 0 : ball.vx > 0;

    if (ballComingToUs) {
      const homeX = isLeft ? LEFT_OF_X : RIGHT_OF_X;
      this._targetX = clamp(ball.x + randomRange(-error, error), isLeft ? LEFT_OF_XMIN : RIGHT_OF_XMIN, isLeft ? LEFT_OF_XMAX : RIGHT_OF_XMAX);
      this._targetY = clamp(ball.y + randomRange(-error, error), OF_YMIN + OF_H / 2, OF_YMAX + OF_H / 2);
    } else {
      // Return to default position
      this._targetX = isLeft ? LEFT_OF_X + OF_W / 2 : RIGHT_OF_X + OF_W / 2;
      this._targetY = FIELD_MID_Y;
    }
  }

  moveOF(dt, of_, isLeft) {
    const speed = lerp(160, OF_SPEED, this.difficulty);
    const centerY = of_.y + OF_H / 2;
    const centerX = of_.x + OF_W / 2;

    const dy = (this._targetY || FIELD_MID_Y) - centerY;
    const dx = (this._targetX || (isLeft ? LEFT_OF_X : RIGHT_OF_X)) - centerX;

    of_.y = clamp(of_.y + clamp(dy, -speed * dt, speed * dt), OF_YMIN, OF_YMAX);

    const xMin = isLeft ? LEFT_OF_XMIN : RIGHT_OF_XMIN;
    const xMax = isLeft ? LEFT_OF_XMAX : RIGHT_OF_XMAX;
    of_.x = clamp(of_.x + clamp(dx, -speed * dt, speed * dt), xMin, xMax);
  }

  _predictBallY(ball, targetX) {
    let x = ball.x, y = ball.y, vx = ball.vx, vy = ball.vy;
    let steps = 0;
    const dt = 1 / 60;
    while (steps < 600) {
      if ((vx > 0 && x >= targetX) || (vx < 0 && x <= targetX)) break;
      x += vx * dt;
      y += vy * dt;
      if (y < FIELD_TOP) { y = FIELD_TOP; vy = Math.abs(vy); }
      if (y > FIELD_BOTTOM) { y = FIELD_BOTTOM; vy = -Math.abs(vy); }
      steps++;
    }
    return y;
  }
}
