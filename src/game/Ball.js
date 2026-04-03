import {
  FIELD_MID_X, FIELD_MID_Y, BALL_RADIUS, BALL_INITIAL_SPEED,
  FIELD_TOP, FIELD_BOTTOM,
} from '../constants.js';
import { randomRange } from '../utils/math.js';

export class Ball {
  constructor() {
    this.x = FIELD_MID_X;
    this.y = FIELD_MID_Y;
    this.vx = 0;
    this.vy = 0;
    this.r = BALL_RADIUS;
    this.active = false;
  }

  reset(serveToLeft = true) {
    this.x = FIELD_MID_X;
    this.y = FIELD_MID_Y;
    const angle = randomRange(-Math.PI / 5, Math.PI / 5);
    const speed = BALL_INITIAL_SPEED;
    this.vx = Math.cos(angle) * speed * (serveToLeft ? -1 : 1);
    this.vy = Math.sin(angle) * speed;
    this.active = false;
  }

  activate() {
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;

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
    // Classic Pong square ball
    const size = this.r * 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - this.r, this.y - this.r, size, size);
  }

  get left()   { return this.x - this.r; }
  get right()  { return this.x + this.r; }
  get top()    { return this.y - this.r; }
  get bottom() { return this.y + this.r; }
}
