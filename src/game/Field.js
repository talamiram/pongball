import {
  CANVAS_W, CANVAS_H, FIELD_TOP, FIELD_BOTTOM, FIELD_LEFT, FIELD_RIGHT,
  FIELD_MID_X, FIELD_MID_Y, GOAL_W, GOAL_H, GOAL_TOP, GOAL_BOTTOM,
  GOAL_LEFT_X, GOAL_RIGHT_X, COLOR_FIELD_DARK, COLOR_FIELD_LIGHT, COLOR_CHALK,
  HUD_H,
} from '../constants.js';

let _cache = null;

export function getFieldCanvas() {
  if (_cache) return _cache;

  const oc = document.createElement('canvas');
  oc.width = CANVAS_W;
  oc.height = CANVAS_H;
  const ctx = oc.getContext('2d');

  _drawField(ctx);

  _cache = oc;
  return _cache;
}

/** Invalidate cache (call if constants change) */
export function invalidateFieldCache() { _cache = null; }

function _drawField(ctx) {
  // HUD background
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);

  // Field base
  ctx.fillStyle = COLOR_FIELD_DARK;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - FIELD_TOP);

  // Vertical mow stripes
  const stripeCount = 14;
  const stripeW = (FIELD_RIGHT - FIELD_LEFT) / stripeCount;
  ctx.fillStyle = COLOR_FIELD_LIGHT;
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillRect(FIELD_LEFT + i * stripeW, FIELD_TOP, stripeW, FIELD_BOTTOM - FIELD_TOP);
  }

  // Field border
  ctx.strokeStyle = COLOR_CHALK;
  ctx.lineWidth = 2;
  ctx.strokeRect(FIELD_LEFT + 1, FIELD_TOP + 1, FIELD_RIGHT - FIELD_LEFT - 2, FIELD_BOTTOM - FIELD_TOP - 2);

  // Center line
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(FIELD_MID_X, FIELD_TOP);
  ctx.lineTo(FIELD_MID_X, FIELD_BOTTOM);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center circle
  ctx.beginPath();
  ctx.arc(FIELD_MID_X, FIELD_MID_Y, 72, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = COLOR_CHALK;
  ctx.beginPath();
  ctx.arc(FIELD_MID_X, FIELD_MID_Y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas
  const penW = 140, penH = 260;
  // Left
  ctx.strokeRect(FIELD_LEFT + 1, FIELD_MID_Y - penH / 2, penW, penH);
  // Right
  ctx.strokeRect(FIELD_RIGHT - penW - 1, FIELD_MID_Y - penH / 2, penW, penH);

  // Goal areas (6-yard box)
  const gaW = 50, gaH = 160;
  ctx.strokeRect(FIELD_LEFT + 1, FIELD_MID_Y - gaH / 2, gaW, gaH);
  ctx.strokeRect(FIELD_RIGHT - gaW - 1, FIELD_MID_Y - gaH / 2, gaW, gaH);

  // Penalty spots
  ctx.beginPath();
  ctx.arc(FIELD_LEFT + 100, FIELD_MID_Y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(FIELD_RIGHT - 100, FIELD_MID_Y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Corner arcs
  const cr = 16;
  _cornerArc(ctx, FIELD_LEFT, FIELD_TOP, 0, Math.PI / 2, cr);
  _cornerArc(ctx, FIELD_RIGHT, FIELD_TOP, Math.PI / 2, Math.PI, cr);
  _cornerArc(ctx, FIELD_RIGHT, FIELD_BOTTOM, Math.PI, 1.5 * Math.PI, cr);
  _cornerArc(ctx, FIELD_LEFT, FIELD_BOTTOM, 1.5 * Math.PI, 2 * Math.PI, cr);

  // Goals (left)
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(GOAL_LEFT_X, GOAL_TOP, GOAL_W, GOAL_H);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(GOAL_LEFT_X, GOAL_TOP, GOAL_W, GOAL_H);
  // Net crosshatch
  _drawNet(ctx, GOAL_LEFT_X, GOAL_TOP, GOAL_W, GOAL_H);

  // Goals (right)
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(GOAL_RIGHT_X, GOAL_TOP, GOAL_W, GOAL_H);
  ctx.strokeStyle = '#cccccc';
  ctx.strokeRect(GOAL_RIGHT_X, GOAL_TOP, GOAL_W, GOAL_H);
  _drawNet(ctx, GOAL_RIGHT_X, GOAL_TOP, GOAL_W, GOAL_H);
}

function _cornerArc(ctx, x, y, startAngle, endAngle, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, startAngle, endAngle);
  ctx.stroke();
}

function _drawNet(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 0.5;
  const spacing = 8;
  // Horizontal lines
  for (let dy = spacing; dy < h; dy += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, y + dy);
    ctx.lineTo(x + w, y + dy);
    ctx.stroke();
  }
  // Vertical lines
  for (let dx = spacing; dx < w; dx += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x + dx, y + h);
    ctx.stroke();
  }
  ctx.restore();
}
