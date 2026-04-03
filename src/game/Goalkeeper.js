import { GK_W, GK_H, GK_YMIN, GK_YMAX, GK_SPEED, FIELD_MID_Y } from '../constants.js';
import { clamp } from '../utils/math.js';
import { drawJersey } from '../utils/draw.js';

export class Goalkeeper {
  constructor(x, team, isLeft) {
    this.x = x;
    this.y = FIELD_MID_Y - GK_H / 2;
    this.w = GK_W;
    this.h = GK_H;
    this.team = team;
    this.isLeft = isLeft;
    this.vx = 0;
    this.vy = 0;
    this.active = false; // highlighted when player-controlled
  }

  moveUp(dt)   { this.vy = -GK_SPEED; this.y = clamp(this.y - GK_SPEED * dt, GK_YMIN, GK_YMAX); }
  moveDown(dt) { this.vy =  GK_SPEED; this.y = clamp(this.y + GK_SPEED * dt, GK_YMIN, GK_YMAX); }
  stopY()      { this.vy = 0; }

  update(dt, axes) {
    if (!axes) { this.stopY(); return; }
    if (axes.up)   this.moveUp(dt);
    else if (axes.down) this.moveDown(dt);
    else this.stopY();
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    if (this.active) {
      // Glow
      ctx.save();
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    drawJersey(ctx, cx, cy, this.w, this.h, this.team.primary, this.team.secondary, '');

    if (this.active) ctx.restore();

    // Active indicator dot
    if (this.active) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(cx, this.y - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
}
