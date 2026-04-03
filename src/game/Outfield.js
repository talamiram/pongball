import {
  OF_W, OF_H, OF_SPEED,
  OF_YMIN, OF_YMAX,
  LEFT_OF_XMIN, LEFT_OF_XMAX,
  RIGHT_OF_XMIN, RIGHT_OF_XMAX,
  FIELD_MID_Y,
} from '../constants.js';
import { clamp } from '../utils/math.js';
import { drawJersey } from '../utils/draw.js';

export class Outfield {
  constructor(x, team, isLeft) {
    this.x = x;
    this.y = FIELD_MID_Y - OF_H / 2;
    this.w = OF_W;
    this.h = OF_H;
    this.team = team;
    this.isLeft = isLeft;
    this.vx = 0;
    this.vy = 0;
    this.active = false;

    this._xMin = isLeft ? LEFT_OF_XMIN : RIGHT_OF_XMIN;
    this._xMax = isLeft ? LEFT_OF_XMAX : RIGHT_OF_XMAX;
  }

  update(dt, axes) {
    if (!axes) { this.vx = 0; this.vy = 0; return; }

    let vx = 0, vy = 0;
    if (axes.up)    vy = -OF_SPEED;
    if (axes.down)  vy =  OF_SPEED;
    if (axes.left)  vx = -OF_SPEED;
    if (axes.right) vx =  OF_SPEED;

    // Diagonal normalise
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.vx = vx;
    this.vy = vy;

    this.x = clamp(this.x + vx * dt, this._xMin, this._xMax);
    this.y = clamp(this.y + vy * dt, OF_YMIN, OF_YMAX);
  }

  render(ctx) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    if (this.active) {
      ctx.save();
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 14;
    }

    drawJersey(ctx, cx, cy, this.w, this.h, this.team.primary, this.team.secondary, '');

    if (this.active) ctx.restore();

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
