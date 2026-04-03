/**
 * Tracks keyboard state for up to 4 players.
 *
 * Player key maps:
 *   P1: WASD + CapsLock to switch
 *   P2: Arrow keys + RShift to switch
 *   P3: IJKL + H to switch
 *   P4: Numpad 8456 + Numpad0 to switch
 */

const PLAYER_KEYS = [
  // P1 (index 0)
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', switchPaddle: 'CapsLock', action: 'KeyF' },
  // P2 (index 1)
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', switchPaddle: 'ShiftRight', action: 'Slash' },
  // P3 (index 2)
  { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', switchPaddle: 'KeyH', action: 'KeyN' },
  // P4 (index 3)
  { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', switchPaddle: 'Numpad0', action: 'NumpadDecimal' },
];

export class InputManager {
  constructor() {
    this._held = new Set();
    this._justPressed = new Set();
    this._justReleased = new Set();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    // Prevent page scrolling on arrow/space keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!this._held.has(e.code)) {
      this._justPressed.add(e.code);
    }
    this._held.add(e.code);
  }

  _onKeyUp(e) {
    this._held.delete(e.code);
    this._justReleased.add(e.code);
  }

  /** Call once per frame AFTER all state reads */
  flush() {
    this._justPressed.clear();
    this._justReleased.clear();
  }

  isHeld(code) {
    return this._held.has(code);
  }

  justPressed(code) {
    return this._justPressed.has(code);
  }

  justReleased(code) {
    return this._justReleased.has(code);
  }

  /** Returns {up, down, left, right} booleans for a given player index */
  getAxes(playerIndex) {
    const keys = PLAYER_KEYS[playerIndex];
    if (!keys) return { up: false, down: false, left: false, right: false };
    return {
      up:    this._held.has(keys.up),
      down:  this._held.has(keys.down),
      left:  this._held.has(keys.left),
      right: this._held.has(keys.right),
    };
  }

  /** True if player just pressed their switch-paddle key this frame */
  justSwitched(playerIndex) {
    const keys = PLAYER_KEYS[playerIndex];
    if (!keys) return false;
    return this._justPressed.has(keys.switchPaddle);
  }

  /** True while player holds action key (penalty aim/shoot) */
  actionHeld(playerIndex) {
    const keys = PLAYER_KEYS[playerIndex];
    if (!keys) return false;
    return this._held.has(keys.action);
  }

  justAction(playerIndex) {
    const keys = PLAYER_KEYS[playerIndex];
    if (!keys) return false;
    return this._justPressed.has(keys.action);
  }
}
