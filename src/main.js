import { CANVAS_W, CANVAS_H } from './constants.js';
import { GameLoop } from './engine/GameLoop.js';
import { InputManager } from './engine/InputManager.js';
import { StateManager } from './engine/StateManager.js';
import { audio } from './engine/AudioManager.js';

import { MainMenuState }     from './states/MainMenuState.js';
import { TeamSelectState }   from './states/TeamSelectState.js';
import { GroupDrawState }    from './states/GroupDrawState.js';
import { GroupStageState }   from './states/GroupStageState.js';
import { BracketState }      from './states/BracketState.js';
import { MatchState }        from './states/MatchState.js';
import { PenaltyState }      from './states/PenaltyState.js';
import { ResultState }       from './states/ResultState.js';

// ── Canvas setup ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

// ── Core systems ──────────────────────────────────────────────────────────────
const input = new InputManager();
const sm    = new StateManager();

// ── States (pre-instantiate, share via sm refs) ───────────────────────────────
const mainMenuState    = new MainMenuState(sm);
const teamSelectState  = new TeamSelectState(sm);
const groupDrawState   = new GroupDrawState(sm);
const groupStageState  = new GroupStageState(sm);
const bracketState     = new BracketState(sm);
const matchState       = new MatchState(sm);
const penaltyState     = new PenaltyState(sm);
const resultState      = new ResultState(sm);

// Attach state references onto sm so states can navigate to each other
sm._mainMenuState   = mainMenuState;
sm._teamSelectState = teamSelectState;
sm._groupDrawState  = groupDrawState;
sm._groupStageState = groupStageState;
sm._bracketState    = bracketState;
sm._matchState      = matchState;
sm._penaltyState    = penaltyState;
sm._resultState     = resultState;

// ── Audio init on first user input ───────────────────────────────────────────
const initAudio = () => { audio.init(); audio.resume(); };
window.addEventListener('keydown', initAudio, { once: true });
window.addEventListener('click',   initAudio, { once: true });

// ── Game loop ─────────────────────────────────────────────────────────────────
const loop = new GameLoop({
  update(dt) {
    sm.update(dt, input);
    input.flush(); // clear just-pressed / just-released AFTER state has read them
  },
  render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    sm.render(ctx);
  },
});

// ── Boot ──────────────────────────────────────────────────────────────────────
sm.change(mainMenuState, {});
loop.start();
