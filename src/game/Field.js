import {
  CANVAS_W, CANVAS_H, FIELD_TOP, FIELD_BOTTOM, FIELD_LEFT, FIELD_RIGHT,
  FIELD_MID_X, HUD_H,
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

export function invalidateFieldCache() { _cache = null; }

function _drawField(ctx) {
  // Full black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // HUD separator line
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(CANVAS_W, HUD_H);
  ctx.stroke();

  // Center dashed line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(FIELD_MID_X, FIELD_TOP);
  ctx.lineTo(FIELD_MID_X, FIELD_BOTTOM);
  ctx.stroke();
  ctx.setLineDash([]);
}
