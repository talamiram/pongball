/**
 * Simple state stack.
 * Each state implements: enter(data), exit(), update(dt, input), render(ctx)
 */
export class StateManager {
  constructor() {
    this._stack = [];
  }

  get current() {
    return this._stack[this._stack.length - 1] || null;
  }

  /** Replace the entire stack with a new state */
  change(state, data = {}) {
    while (this._stack.length) {
      this._stack.pop().exit();
    }
    this._stack.push(state);
    state.enter(data);
  }

  /** Push a state on top (overlay) */
  push(state, data = {}) {
    this._stack.push(state);
    state.enter(data);
  }

  /** Pop the top state and optionally pass return data to the one below */
  pop(returnData = {}) {
    const top = this._stack.pop();
    if (top) top.exit();
    const below = this.current;
    if (below && below.resume) below.resume(returnData);
  }

  update(dt, input) {
    if (this.current) this.current.update(dt, input);
  }

  render(ctx) {
    if (this.current) this.current.render(ctx);
  }
}
