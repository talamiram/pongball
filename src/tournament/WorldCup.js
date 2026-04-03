import { TEAMS } from './teams.js';
import { randomRange } from '../utils/math.js';
import { AI_ROUND_BONUS, AI_MAX_DIFFICULTY } from '../constants.js';

/**
 * Full World Cup structure: 4 groups of 4 → Round of 16 → QF → SF → Final
 */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function simulateCPUMatch(teamA, teamB, round = 0) {
  const dA = Math.min(AI_MAX_DIFFICULTY, teamA.difficulty + round * AI_ROUND_BONUS);
  const dB = Math.min(AI_MAX_DIFFICULTY, teamB.difficulty + round * AI_ROUND_BONUS);
  const total = dA + dB;
  const pA = dA / total;

  // Generate random scores, biased toward the better team
  const winnerIsA = Math.random() < pA;
  const maxGoals = 5;
  const winnerGoals = Math.floor(randomRange(1, maxGoals + 1));
  const loserGoals = Math.floor(randomRange(0, winnerGoals));
  return winnerIsA
    ? { scoreA: winnerGoals, scoreB: loserGoals, winner: teamA }
    : { scoreA: loserGoals,  scoreB: winnerGoals, winner: teamB };
}

function simulateCPUGroupMatch(teamA, teamB) {
  const dA = teamA.difficulty;
  const dB = teamB.difficulty;
  const total = dA + dB;
  const pA = dA / total;

  // Draws more common in group stage
  const r = Math.random();
  const maxGoals = 4;
  if (r < 0.22) {
    // draw
    const g = Math.floor(randomRange(0, maxGoals));
    return { scoreA: g, scoreB: g, winner: null };
  }
  const winnerIsA = r < 0.22 + pA * 0.78;
  const winnerGoals = Math.floor(randomRange(1, maxGoals + 1));
  const loserGoals = Math.floor(randomRange(0, winnerGoals));
  return winnerIsA
    ? { scoreA: winnerGoals, scoreB: loserGoals, winner: teamA }
    : { scoreA: loserGoals,  scoreB: winnerGoals, winner: teamB };
}

export class WorldCup {
  constructor(playerTeamId) {
    this.playerTeamId = playerTeamId;

    // Assign teams to 4 groups
    const others = shuffle(TEAMS.filter(t => t.id !== playerTeamId));
    const player = TEAMS.find(t => t.id === playerTeamId);

    // Player goes in group A slot 0; fill rest
    this.groups = [
      [player, others[0],  others[1],  others[2]],
      [others[3],  others[4],  others[5],  others[6]],
      [others[7],  others[8],  others[9],  others[10]],
      [others[11], others[12], others[13], others[14]],
    ];
    this.groupNames = ['A', 'B', 'C', 'D'];

    // Group standings: { team, played, won, drawn, lost, gf, ga, pts }
    this.standings = this.groups.map(group =>
      group.map(team => ({ team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }))
    );

    // Group match schedule (each pair plays once)
    this.groupMatches = this.groups.map((group, gi) => {
      const matches = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          matches.push({ teamA: group[i], teamB: group[j], result: null, groupIndex: gi });
        }
      }
      return matches; // 6 matches per group
    });

    // Track which group match the player needs to play next
    this.groupMatchIndex = 0; // index into this.groupMatches[playerGroupIndex]
    this.playerGroupIndex = 0; // always group A

    // Knockout rounds
    this.knockoutRound = 0; // 0=R16, 1=QF, 2=SF, 3=Final
    this.knockoutMatches = null; // built after group stage
    this.champion = null;
    this.phase = 'group'; // 'group' | 'knockout' | 'done'
  }

  get playerGroup() { return this.groups[this.playerGroupIndex]; }
  get playerStandings() { return this.standings[this.playerGroupIndex]; }
  get playerGroupMatches() { return this.groupMatches[this.playerGroupIndex]; }

  /** Next group match the player must play */
  getNextPlayerGroupMatch() {
    return this.playerGroupMatches.find(m => m.result === null && this._involvesPlayer(m));
  }

  _involvesPlayer(match) {
    return match.teamA.id === this.playerTeamId || match.teamB.id === this.playerTeamId;
  }

  /** Simulate all CPU group matches in player's group that don't involve the player */
  simulateCPUGroupMatches(groupIndex) {
    for (const m of this.groupMatches[groupIndex]) {
      if (m.result !== null) continue;
      if (groupIndex === this.playerGroupIndex && this._involvesPlayer(m)) continue;
      m.result = simulateCPUGroupMatch(m.teamA, m.teamB);
      this._applyGroupResult(groupIndex, m);
    }
  }

  /** Call after player's group match finishes */
  recordPlayerGroupMatch(match, scoreA, scoreB) {
    match.result = {
      scoreA,
      scoreB,
      winner: scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null,
    };
    this._applyGroupResult(this.playerGroupIndex, match);
  }

  _applyGroupResult(groupIndex, match) {
    const standings = this.standings[groupIndex];
    const rowA = standings.find(r => r.team.id === match.teamA.id);
    const rowB = standings.find(r => r.team.id === match.teamB.id);
    const { scoreA, scoreB, winner } = match.result;
    rowA.played++; rowA.gf += scoreA; rowA.ga += scoreB;
    rowB.played++; rowB.gf += scoreB; rowB.ga += scoreA;
    if (winner === null) {
      rowA.drawn++; rowA.pts++;
      rowB.drawn++; rowB.pts++;
    } else if (winner.id === match.teamA.id) {
      rowA.won++; rowA.pts += 3;
      rowB.lost++;
    } else {
      rowB.won++; rowB.pts += 3;
      rowA.lost++;
    }
  }

  getSortedStandings(groupIndex) {
    return [...this.standings[groupIndex]].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });
  }

  isGroupStageComplete() {
    return this.groups.every((_, gi) =>
      this.groupMatches[gi].every(m => m.result !== null)
    );
  }

  buildKnockoutBracket() {
    // Top 2 from each group → 8 teams, seeded A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
    const tops = this.groups.map((_, gi) => this.getSortedStandings(gi));
    const r16 = [
      { teamA: tops[0][0].team, teamB: tops[1][1].team }, // A1 vs B2
      { teamA: tops[2][0].team, teamB: tops[3][1].team }, // C1 vs D2
      { teamA: tops[1][0].team, teamB: tops[0][1].team }, // B1 vs A2
      { teamA: tops[3][0].team, teamB: tops[2][1].team }, // D1 vs C2
    ].concat([
      { teamA: tops[0][0].team, teamB: tops[1][1].team }, // duplicated brackets for full R16 — fill with other pairs
    ]);

    // Build full R16 (8 matches)
    this.knockoutMatches = [
      // Round of 16 (8 matches)
      [
        { teamA: tops[0][0].team, teamB: tops[1][1].team, result: null },
        { teamA: tops[2][0].team, teamB: tops[3][1].team, result: null },
        { teamA: tops[0][1].team, teamB: tops[1][0].team, result: null },
        { teamA: tops[2][1].team, teamB: tops[3][0].team, result: null },
      ],
      // QF (4)
      [null, null, null, null],
      // SF (2)
      [null, null],
      // Final (1)
      [null],
    ];

    this.knockoutRound = 0;
    this.phase = 'knockout';
  }

  getNextKnockoutPlayerMatch() {
    if (!this.knockoutMatches) return null;
    const round = this.knockoutMatches[this.knockoutRound];
    return round ? round.find(m => m && m.result === null && this._involvesPlayer(m)) : null;
  }

  /** Simulate all CPU matches in current knockout round (except player's match) */
  simulateCPUKnockoutMatches() {
    const round = this.knockoutMatches[this.knockoutRound];
    if (!round) return;
    for (const m of round) {
      if (!m || m.result !== null) continue;
      if (this._involvesPlayer(m)) continue;
      m.result = simulateCPUMatch(m.teamA, m.teamB, this.knockoutRound);
    }
  }

  recordKnockoutMatch(match, scoreA, scoreB, penaltyWinnerId = null) {
    let winner;
    if (scoreA > scoreB) winner = match.teamA;
    else if (scoreB > scoreA) winner = match.teamB;
    else winner = penaltyWinnerId === match.teamA.id ? match.teamA : match.teamB;

    match.result = { scoreA, scoreB, winner, penalties: !!penaltyWinnerId };
  }

  advanceKnockoutRound() {
    const round = this.knockoutMatches[this.knockoutRound];
    const winners = round.map(m => m.result.winner);

    if (this.knockoutRound === 3) {
      this.champion = winners[0];
      this.phase = 'done';
      return;
    }

    // Build next round
    const next = [];
    for (let i = 0; i < winners.length; i += 2) {
      next.push({ teamA: winners[i], teamB: winners[i + 1], result: null });
    }
    this.knockoutMatches[this.knockoutRound + 1] = next;
    this.knockoutRound++;

    // Check if player is eliminated
    if (!this.knockoutMatches[this.knockoutRound].some(m => this._involvesPlayer(m))) {
      // Player is out; simulate remaining
      this._simulateToEnd();
    }
  }

  _simulateToEnd() {
    for (let r = this.knockoutRound; r < 4; r++) {
      const round = this.knockoutMatches[r];
      if (!round) break;
      for (const m of round) {
        if (!m || m.result) continue;
        m.result = simulateCPUMatch(m.teamA, m.teamB, r);
      }
      if (r < 3) {
        const winners = round.map(m => m.result.winner);
        const next = [];
        for (let i = 0; i < winners.length; i += 2) {
          next.push({ teamA: winners[i], teamB: winners[i + 1], result: null });
        }
        this.knockoutMatches[r + 1] = next;
      } else {
        this.champion = round[0].result.winner;
        this.phase = 'done';
      }
    }
  }

  isPlayerEliminated() {
    if (this.phase === 'done') return true;
    if (this.phase === 'knockout') {
      // Check if any remaining match involves player
      for (let r = this.knockoutRound; r < 4; r++) {
        const round = this.knockoutMatches[r];
        if (!round) continue;
        if (round.some(m => m && this._involvesPlayer(m))) return false;
      }
      return true;
    }
    return false;
  }

  getKnockoutRoundName() {
    return ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'][this.knockoutRound] || '';
  }
}
