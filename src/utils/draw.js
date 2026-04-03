/**
 * Draw a jersey silhouette (Italy-90 style) on canvas.
 * The jersey is centered at (cx, cy) with given width and height.
 */
export function drawJersey(ctx, cx, cy, w, h, primaryColor, secondaryColor, label) {
  const sleeveW = Math.round(w * 0.35);
  const sleeveH = Math.round(h * 0.32);
  const bodyW = w;
  const bodyH = h;
  const neckW = Math.round(w * 0.28);
  const neckH = Math.round(h * 0.14);

  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.save();

  // Left sleeve
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(x - sleeveW, y + 4, sleeveW, sleeveH);

  // Right sleeve
  ctx.fillRect(x + bodyW, y + 4, sleeveW, sleeveH);

  // Body
  ctx.fillStyle = primaryColor;
  ctx.fillRect(x, y, bodyW, bodyH);

  // Neck cutout (V-collar shape using clipping trick — just draw a dark V)
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, y);
  ctx.lineTo(cx, y + neckH);
  ctx.lineTo(cx + neckW / 2, y);
  ctx.closePath();
  ctx.fill();

  // Sleeve accent lines
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(x, y + 4, 3, sleeveH);
  ctx.fillRect(x + bodyW - 3, y + 4, 3, sleeveH);

  // Label (country code, tiny)
  if (label) {
    ctx.fillStyle = secondaryColor === '#FFFFFF' || secondaryColor === '#ffffff' ? '#000' : '#fff';
    ctx.font = `bold ${Math.max(6, Math.round(h * 0.16))}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + h * 0.15);
  }

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, bodyW, bodyH);

  ctx.restore();
}

export function drawRoundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

export function drawText(ctx, text, x, y, {
  font = '10px monospace',
  color = '#fff',
  align = 'left',
  baseline = 'top',
  shadow = null,
} = {}) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.shadowColor = shadow.color || '#000';
    ctx.shadowBlur = shadow.blur || 4;
    ctx.shadowOffsetX = shadow.x || 0;
    ctx.shadowOffsetY = shadow.y || 0;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Draw a soccer ball (black & white pentagon pattern) */
export function drawSoccerBall(ctx, cx, cy, r) {
  // White base
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pentagon patches — 6 black shapes arranged around the center
  ctx.fillStyle = '#111111';
  const patches = 6;
  const patchRadius = r * 0.38;
  const patchDist = r * 0.52;

  // Center patch
  drawPentagon(ctx, cx, cy, patchRadius);

  // Surrounding patches
  for (let i = 0; i < patches; i++) {
    const angle = (i / patches) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * patchDist;
    const py = cy + Math.sin(angle) * patchDist;
    drawPentagon(ctx, px, py, patchRadius * 0.85);
  }

  ctx.restore();
}

function drawPentagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
