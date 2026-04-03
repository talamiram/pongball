import {
  FIELD_MID_X, FIELD_MID_Y, BALL_RADIUS, BALL_INITIAL_SPEED, BALL_TRAIL_LEN,
  FIELD_TOP, FIELD_BOTTOM,
} from '../constants.js';
import { drawSoccerBall } from '../utils/draw.js';
import { randomSign, randomRange } from '../utils/math.js';

export class Ball {
  constructor() {
    this.x = FIELD_MID_X;
    this.y = FIELD_MID_Y;
    this.vx = 0;
    this.vy = 0;
    this.r = BALL_RADIUS;
    this.trail = [];
    this.active = false; // false = waiting for kickoff
  }

  reset(serveToLeft = true) {
    this.x = FIELD_MID_X;
    this.y = FIELD_MID_Y;
    const angle = randomRange(-Math.PI / 5, Math.PI / 5);
    const speed = BALL_INITIAL_SPEED;
    this.vx = Math.cos(angle) * speed * (serveToLeft ? -1 : 1);
    this.vy = Math.sin(angle) * speed;
    this.trail = [];
    this.active = false;
  }

  activate() {
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;

    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > BALL_TRAIL_LEN) this.trail.shift();

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Top / bottom wall bounce
    if (this.y - this.r < FIELD_TOP) {
      this.y = FIELD_TOP + this.r;
      this.vy = Math.abs(this.vy);
      return 'wall';
    }
    if (this.y + this.r > FIELD_BOTTOM) {
      this.y = FIELD_BOTTOM - this.r;
      this.vy = -Math.abs(this.vy);
      return 'wall';
    }

    return null;
  }

  render(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.35;
      const tr = this.trail[i];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, this.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ball
    drawSoccerBall(ctx, this.x, this.y, this.r);
  }

  /** Bounding box for AABB collision */
  get left()   { return this.x - this.r; }
  get right()  { return this.x + this.r; }
  get top()    { return this.y - this.r; }
  get bottom() { return this.y + this.r; }
}
