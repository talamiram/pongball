import {
  BALL_MAX_SPEED, BALL_SPEED_INC,
  GOAL_TOP, GOAL_BOTTOM, FIELD_LEFT, FIELD_RIGHT, GOAL_W,
  GK_W, GK_H, OF_W, OF_H,
} from '../constants.js';
import { clamp } from '../utils/math.js';

const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60 degrees

/**
 * Resolve ball vs goalkeeper collision.
 * Returns true if collision occurred.
 */
export function resolveGK(ball, gk) {
  if (!_aabb(ball, gk)) return false;

  // Depenetrate
  if (gk.isLeft) {
    ball.x = gk.right + ball.r + 1;
    ball.vx = Math.abs(ball.vx);
  } else {
    ball.x = gk.left - ball.r - 1;
    ball.vx = -Math.abs(ball.vx);
  }

  // Angle from hit position
  const hitPos = (ball.y - (gk.y + gk.h / 2)) / (gk.h / 2);
  const angle = clamp(hitPos, -1, 1) * MAX_BOUNCE_ANGLE;
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) * BALL_SPEED_INC, BALL_MAX_SPEED);

  ball.vx = Math.cos(angle) * speed * (gk.isLeft ? 1 : -1);
  ball.vy = Math.sin(angle) * speed;

  return true;
}

/**
 * Resolve ball vs outfield player collision.
 * The outfield player's velocity is added for a "dribble" effect.
 */
export function resolveOF(ball, of_) {
  if (!_aabb(ball, of_)) return false;

  if (of_.isLeft) {
    ball.x = of_.right + ball.r + 1;
    ball.vx = Math.abs(ball.vx);
  } else {
    ball.x = of_.left - ball.r - 1;
    ball.vx = -Math.abs(ball.vx);
  }

  const hitPos = (ball.y - (of_.y + of_.h / 2)) / (of_.h / 2);
  const angle = clamp(hitPos, -1, 1) * MAX_BOUNCE_ANGLE;
  const speed = Math.min(Math.hypot(ball.vx, ball.vy) * BALL_SPEED_INC, BALL_MAX_SPEED);

  ball.vx = Math.cos(angle) * speed * (of_.isLeft ? 1 : -1);
  // Add outfield player's vy for dribble feel
  ball.vy = Math.sin(angle) * speed + of_.vy * 0.4;

  // Also add vx influence for horizontal hits
  if (of_.isLeft && of_.vx > 0) ball.vx *= 1.05;
  if (!of_.isLeft && of_.vx < 0) ball.vx *= 1.05;

  return true;
}

/**
 * Check if ball went into a goal.
 * Returns 'left' (right team scored), 'right' (left team scored), or null.
 */
export function checkGoal(ball) {
  if (ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
    if (ball.x - ball.r < FIELD_LEFT) return 'left';   // right team scored
    if (ball.x + ball.r > FIELD_RIGHT) return 'right'; // left team scored
  }
  return null;
}

/**
 * Sub-stepped physics update. Call once per frame.
 * Returns: { wallHit: bool, gkHit: bool, ofHit: bool, goal: null|'left'|'right' }
 */
export function physicsStep(dt, ball, leftGK, rightGK, leftOF, rightOF) {
  const result = { wallHit: false, gkHit: false, ofHit: false, goal: null };
  if (!ball.active) return result;

  // Sub-steps to prevent tunneling at high speed
  const maxStep = Math.min(ball.r * 0.8, 8);
  const totalDist = Math.hypot(ball.vx * dt, ball.vy * dt);
  const steps = Math.max(1, Math.ceil(totalDist / maxStep));
  const subDt = dt / steps;

  for (let s = 0; s < steps; s++) {
    const wallEvent = ball.update(subDt);
    if (wallEvent === 'wall') result.wallHit = true;

    if (resolveGK(ball, leftGK))  { result.gkHit = true; }
    if (resolveGK(ball, rightGK)) { result.gkHit = true; }
    if (resolveOF(ball, leftOF))  { result.ofHit = true; }
    if (resolveOF(ball, rightOF)) { result.ofHit = true; }

    const goal = checkGoal(ball);
    if (goal) { result.goal = goal; break; }
  }

  return result;
}

function _aabb(ball, paddle) {
  return (
    ball.right  > paddle.left   &&
    ball.left   < paddle.right  &&
    ball.bottom > paddle.top    &&
    ball.top    < paddle.bottom
  );
}
