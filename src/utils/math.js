export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

export function degToRad(deg) {
  return deg * Math.PI / 180;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function weightedRandom(teams) {
  // Given array of {difficulty}, pick one weighted by difficulty
  const total = teams.reduce((s, t) => s + t.difficulty, 0);
  let r = Math.random() * total;
  for (const t of teams) {
    r -= t.difficulty;
    if (r <= 0) return t;
  }
  return teams[teams.length - 1];
}
