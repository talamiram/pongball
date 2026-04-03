import { Goalkeeper } from './Goalkeeper.js';
import { Outfield } from './Outfield.js';
import {
  LEFT_GK_X, LEFT_OF_X, RIGHT_GK_X, RIGHT_OF_X,
} from '../constants.js';

/**
 * Represents one team's two paddles.
 * playerSlots: array of player indices (0-3) controlling each paddle.
 *   e.g. [0, -1] means P1 controls GK, no human on OF (AI)
 *        [0,  1] means P1=GK, P2=OF
 *        [-1,-1] means full AI
 */
export class Team {
  constructor(teamData, isLeft, playerSlots = [-1, -1]) {
    this.data = teamData;
    this.isLeft = isLeft;

    const gkX = isLeft ? LEFT_GK_X : RIGHT_GK_X;
    const ofX = isLeft ? LEFT_OF_X : RIGHT_OF_X;

    this.gk = new Goalkeeper(gkX, teamData, isLeft);
    this.of = new Outfield(ofX, teamData, isLeft);

    // playerSlots[0] = player index for GK, playerSlots[1] = player index for OF
    // -1 = AI controlled
    this.playerSlots = [...playerSlots];

    // Active paddle: 'gk' or 'of' — relevant for single-player switching
    // For multi-player, each player controls their paddle without switching
    this.activePaddle = 'gk'; // default: control GK first

    this._updateActiveMarkers();
  }

  /** Toggle active paddle (CAPSLOCK switch) for a given human player */
  switchActive(playerIndex) {
    // Only makes sense if this player controls both paddles (1P mode)
    const ownsGK = this.playerSlots[0] === playerIndex;
    const ownsOF = this.playerSlots[1] === playerIndex;
    if (ownsGK && ownsOF) {
      this.activePaddle = this.activePaddle === 'gk' ? 'of' : 'gk';
      this._updateActiveMarkers();
    }
  }

  _updateActiveMarkers() {
    // Glow the currently active human-controlled paddle
    const hasHumanGK = this.playerSlots[0] !== -1;
    const hasHumanOF = this.playerSlots[1] !== -1;
    const singleHuman = this.playerSlots[0] === this.playerSlots[1] && this.playerSlots[0] !== -1;

    if (singleHuman) {
      this.gk.active = this.activePaddle === 'gk';
      this.of.active = this.activePaddle === 'of';
    } else {
      this.gk.active = hasHumanGK;
      this.of.active = hasHumanOF;
    }
  }

  /**
   * Get axes for a paddle, given input manager.
   * Returns axes object or null (AI will handle it).
   */
  getGKAxes(input) {
    const pi = this.playerSlots[0];
    if (pi === -1) return null; // AI
    const singleHuman = this.playerSlots[0] === this.playerSlots[1];
    if (singleHuman && this.activePaddle !== 'gk') return null; // human switched away
    return input.getAxes(pi);
  }

  getOFAxes(input) {
    const pi = this.playerSlots[1];
    if (pi === -1) return null; // AI
    const singleHuman = this.playerSlots[0] === this.playerSlots[1];
    if (singleHuman && this.activePaddle !== 'of') return null; // human switched away
    return input.getAxes(pi);
  }

  /** Check if any player on this team just pressed switch */
  checkSwitch(input) {
    for (const pi of new Set(this.playerSlots)) {
      if (pi !== -1 && input.justSwitched(pi)) {
        this.switchActive(pi);
      }
    }
  }

  get paddles() { return [this.gk, this.of]; }
}
