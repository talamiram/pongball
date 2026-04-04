# PongBall — Game Bible

> A Pong-meets-football game. Italy vs Argentina, 1990 World Cup semifinal.
> Live at **pongball.io** — deployed via Cloudflare Pages on push to `main`.

---

## Architecture

**Single-file game.** Everything lives in `index.html` — inline CSS, inline JS, no build step, no dependencies. The old `src/` folder with 30+ module files is legacy and NOT used.

**Deployment pipeline:** Edit `index.html` → `git push origin main` → Cloudflare Pages auto-deploys → live at pongball.io within ~60 seconds.

**Git remote uses a fine-grained PAT** embedded in the origin URL. The token has Contents: Read/Write permission scoped to `talamiram/pongball` only.

**Canvas-based rendering.** Full-screen responsive canvas (`window.innerWidth` x `window.innerHeight`). All sizes are ratio-based (percentage of W or H) so the game scales to any screen.

---

## Core Concept

Pong, but football. Two teams of 11 players each in a **4-4-2 formation grid**. Each player is a small vertical paddle. The ball bounces off every paddle as it weaves through the formation. One player is human-controlled (Maradona); the rest are AI.

There are **two core shot mechanics**:

1. **Catch and release**: Let the ball hit your paddle (no Space) → it's trapped. Aim with arrows, release with Space. Hold Space longer to lob higher.
2. **Volley / first-time shot**: Hold Space AS the ball arrives → immediate hard shot, no catch. Aim with arrows at the moment of contact. Hold duration before contact controls lob height.

**Goal posts** define a goal mouth (30% of screen height, centered). Ball must enter the goal mouth to score — including lobbed balls that fly in. Shots that miss hit the post or wall and bounce back.

---

## Controls

| Input | Action |
|---|---|
| Arrow keys (up/down) | Move controlled paddle vertically + aim volleys |
| Arrow keys (left/right) | Move controlled paddle horizontally (outfield only) |
| Space (tap + release) | Flat shot / flat pass along the ground |
| Space (hold + release) | Lob — longer hold = higher ball. Speed stays constant. |
| Space held on contact | **Volley** — first-time shot, directed by arrows, no catch |

**Control switching:** When ball is on your GK (serve state), arrow keys move the GK up/down to aim the serve. The instant Space is released (serve happens), control switches back to your forward (Maradona).

---

## The Lob Mechanic (Critical Design)

This is the core skill mechanic. **Press duration ONLY affects height (z-axis), NEVER speed.**

- `ball.vz = chargeTime * H * LOB_POWER` (currently LOB_POWER = 0.9)
- Speed is always `W * BALL_SPEED` (constant 0.22 of screen width)
- No cap on charge time — hold too long and the ball goes comically high, wasting time
- Gravity (`GRAVITY = 900 px/s²`) pulls it back down in a natural arc
- Ball visually rises (drawn offset upward by `ball.z` pixels), grows slightly (scale), and casts a ground shadow
- **Airborne ball (z > AIR_THRESHOLD = 10) flies over ALL paddles** — no collisions, no catches, no goals
- Ball can only be caught, deflected, or score when `ball.z ≈ 0` (on the ground)
- If airborne ball crosses the goal line, it bounces back (went "over the goal")

This creates real tactical depth: flat shots are fast but must thread through the formation grid. Lobs clear defenders but are slow to land and give the opponent time to reposition.

---

## Ball State Machine

```
on_gk → (Space release) → live
live → (hits player's mainFwd, Space NOT held) → held_player
live → (hits player's mainFwd, Space IS held) → live (VOLLEY — immediate shot)
live → (hits AI's mainFwd) → held_ai
held_player → (Space release or 2s auto) → live
held_ai → (AI timer or 2s auto) → live
live → (enters goal mouth on ground) → on_gk (after goal pause)
```

States:
- **on_gk**: Ball stuck to front of serving GK. Player aims GK with arrows, releases with Space. AI serves after random delay (0.6–1.4s) with slight random lob.
- **live**: Ball is in play, physics running, collisions active.
- **held_player**: Ball stuck to front of Maradona. Player can move, aim, and shoot with Space. Auto-releases after `HOLD_TIME_LIMIT` (2.0s) as a quick flat shot.
- **held_ai**: Ball stuck to front of AI's main forward (Schillaci). AI aims briefly then shoots after 0.4–1.2s. Also auto-releases at 2s.

---

## Teams: Italia 90 Semifinal

### Argentina (Left, Light Blue #75AADB) — Player's Team

| # | Name | Role | Formation Position |
|---|---|---|---|
| 12 | Goycochea | GK | Goal line |
| 14 | Giusti | DEF | Back 4, top |
| 18 | Serrizuela | DEF | Back 4 |
| 19 | Ruggeri | DEF | Back 4 |
| 16 | Olarticoechea | DEF | Back 4, bottom |
| 20 | Simón | MID | Midfield 4, top |
| 4 | Basualdo | MID | Midfield 4 |
| 7 | Burruchaga | MID | Midfield 4 |
| 6 | Calderón | MID | Midfield 4, bottom |
| **10** | **Maradona (C)** | **FWD** | **Player-controlled forward** |
| 8 | Caniggia | FWD | AI forward |

### Italy (Right, Dark Blue #003DA5) — AI Team

| # | Name | Role | Formation Position |
|---|---|---|---|
| 1 | Zenga | GK | Goal line |
| 2 | Bergomi | DEF | Back 4, top |
| 6 | Baresi (C) | DEF | Back 4 |
| 5 | Ferri | DEF | Back 4 |
| 3 | Maldini | DEF | Back 4, bottom |
| 7 | Donadoni | MID | Midfield 4, top |
| 8 | De Napoli | MID | Midfield 4 |
| 16 | Berti | MID | Midfield 4 |
| 11 | Giannini | MID | Midfield 4, bottom |
| **19** | **Schillaci** | **FWD** | **AI main forward (can catch)** |
| 15 | Baggio | FWD | AI forward |

---

## The Formation Grid (Identity System)

**There are NOT 11 paddles per side.** Each team has exactly **2 paddles**: one GK and one outfield player. The formation grid is a **naming system** — the outfield paddle's identity changes based on where it is on the field when it receives or shoots the ball.

This is how it works: the 4-4-2 formation defines **zones** on the field. When the paddle catches, volleys, or shoots from a zone, it "becomes" the player assigned to that zone. The paddle's displayed name and number update accordingly.

**Zone x-ranges (ratio of screen width, left team):**
```
DEF zone:  0.05 – 0.22   →  Giusti / Serrizuela / Ruggeri / Olarticoechea
MID zone:  0.22 – 0.38   →  Simón / Basualdo / Burruchaga / Calderón
FWD zone:  0.38 – 0.50   →  Maradona / Caniggia
```

**Within each zone, y-position picks the specific player.** The 4-player lines (DEF, MID) are split into vertical bands at 0.15, 0.38, 0.62, 0.85. The 2-player lines (FWD) split at 0.37, 0.63.

**Example:** Your paddle is at x=0.15, y=0.70 when it catches the ball → that's the DEF zone, lower half → you're "Olarticoechea #16". You run forward to x=0.40 and shoot → now you're "Maradona #10" (FWD zone, center).

**The AI outfield paddle works the same way** for the opposing team. Schillaci, Baggio, Baresi etc. are all the same paddle — its name changes with position.

**Why this matters:**
- Commentary: "Goal scored by Maradona!" vs "Goal scored by Burruchaga!" based on where the shot came from
- Stats tracking: goals per player, even though it's one paddle
- Feels like a full team without the chaos of 22 paddles
- The GK is always the GK (Goycochea / Zenga) — that identity is fixed

---

## Paddle Sizes

Each team has exactly **2 physical paddles**: one GK and one outfield. That's it. Both teams' outfield paddles must be the **same size** — the player's advantage is being human-controlled, not having a bigger paddle.

All sizes are responsive (height as ratio of screen H):

| Paddle | Width (px) | Height (ratio of H) |
|---|---|---|
| GK | 8 | 0.07 |
| Outfield (both teams) | 7 | 0.05 |

There is NO separate `PLAYER_H_RATIO`. Both outfield paddles use the same dimensions. Do not give the player's outfield paddle a larger size — remove any `_isPlayer` size branching in `makePaddle()`.

The outfield paddle's **identity** (name, number) changes by position zone (see Formation Grid above), but its **physical size stays constant** regardless of which player name it's showing.

---

## Collision & Physics

**Sub-stepped physics** to prevent tunneling: each frame's movement is divided into steps no larger than `ball.size * 0.5` pixels.

**Paddle collision:** Ball bounces off the paddle face. Exit angle is determined by where the ball hits the paddle (center = straight, edge = steep angle, up to `MAX_BOUNCE_ANGLE = π/3`). Speed increases by `BALL_ACCEL = 1.02×` on each hit, capped at `W * BALL_MAX_SPEED`.

**Catch priority:** In the physics loop, the player's main forward is checked FIRST (so the player catches over a random deflection). Then AI's main forward. Then all remaining paddles (deflect only).

**Goal posts:** Physical rectangles at top and bottom of goal mouth. Ball bounces off posts and off the back wall outside the goal mouth. Goals only count when ball crosses the goal line within the mouth AND is on the ground (not airborne).

**Wall bounces:** Top and bottom screen edges bounce the ball with 0.97 damping.

---

## GK AI

Both goalkeepers use the same AI with a `skill` parameter (0–1):

- `GK_SKILL_LEFT = 0.72` (Goycochea — player's GK, slightly better)
- `GK_SKILL_RIGHT = 0.68` (Zenga)

Higher skill = faster tracking, less lag. GK tracks ball y when ball is moving toward their goal, returns to center otherwise. Movement is smoothed with a lag factor: `effectiveTarget = current + (target - current) * (1 - lag)`.

Left GK AI is **skipped** when `ballState === 'on_gk' && serveFromLeft` — player controls the GK during serve.

---

## Formation AI

Non-player outfield paddles use zone-based AI:

1. Calculate `activeFactor` based on ball distance (0 = ball far, 1 = ball close)
2. Track ball y-position weighted by activeFactor (more active = tracks more closely)
3. Stay within vertical zone (homeY ± zoneMargin × 3)
4. Forwards/midfielders have slight x-drift (push forward on attack, retreat on defense)
5. Movement speed: forwards 0.7× base, others 0.55× base

Right team's main forward (Schillaci) has special AI for the catch-and-shoot mechanic: when holding the ball, he moves to a shooting position then fires after 0.4–1.2s with a slight random lob.

---

## Rendering

**Dark green pitch** (#0a1f0a) with lighter green (#1a4d1a) field markings: center line (dashed), center circle, penalty areas, goal areas, field border.

**Goal posts** are white rectangles. Goal net is a subtle grid of thin white lines behind the posts.

**Paddles** are drawn in team colors. Player-controlled paddle has a glow effect (shadowBlur). Each paddle has its shirt number displayed above it in small monospace text.

**Ball** is a white circle. When airborne: drawn offset upward by `ball.z` pixels, scales up slightly (`1 + z/300`), and casts an elliptical shadow on the ground that grows and fades with height.

**Scoreboard** at top center: team short codes in team colors flanking the score. Player name shown below Maradona's paddle when in outfield control.

**HUD elements:**
- Hold timer bar (white, turns red below 30%) when player is holding the ball
- Charge indicator (green→yellow gradient) when Space is held
- Text prompts for serve/shoot instructions

---

## Game Modes

The game starts on a **menu screen** (press 1/2 or arrow+Enter to select):

### Match Mode
Full 4-4-2 formation grid, Argentina vs Italy, 22 players. This is the real game.

### Physics Lab
Stripped-down testing mode for iterating on core mechanics. **Only 3 paddles**: your GK (Goycochea), your forward (Maradona), and the opposing GK (Zenga). No formation in the way, no AI forward. Just you, the ball, and the goal.

Includes a **debug HUD** (top-left) showing:
- Ball speed (% of screen width)
- Ball height (z pixels above ground)
- Ball vertical velocity (vz)
- Peak height of current flight
- Last shot's charge time (ms) and peak height
- Airborne status

Use Physics Lab to tune: lob arc feel, charge sensitivity, gravity, goal post collisions, GK behavior, ball speed. ESC returns to menu.

**When working on feel/mechanics, always test in Physics Lab first** — it isolates the core loop without formation noise.

---

## Known Issues & Debt

1. Old `src/` folder, `style.css`, and `setup.sh` still exist in the repo — unused, can be deleted
2. Formation AI is basic — players don't coordinate or make "runs"
3. No sound effects
4. No graphics/sprites — everything is rectangles and circles
5. Single match only — no tournament, no team selection screen
6. No 2-player support yet (was planned: WASD for second player)
7. Ball sometimes gets stuck in rapid paddle collisions when multiple formation players are close together
8. No offside mechanic
9. Player can move Maradona anywhere in their half — no position locking

---

## Design Principles

1. **Feel over features.** Get the core mechanic feeling right before adding anything new. The catch-and-release + lob system is the game.
2. **Single file.** No build tools, no dependencies, no complexity. Everything inline in index.html.
3. **Ratio-based sizing.** Every dimension is a percentage of W or H. The game must look right on any screen.
4. **Pong DNA.** Vertical paddles, ball bouncing, that satisfying deflection feel. The football layer adds formation and lobbing, but underneath it's still Pong.
5. **Iterate fast.** Edit → push → live in 60 seconds. Test in browser, not in code.

---

## Roadmap Ideas (Not Started)

- Team selection screen (multiple World Cup squads)
- Tournament mode (group stage → knockout)
- 2-player mode (WASD + QE for second player)
- Player switching (tab between your formation players)
- Set pieces (corners, free kicks)
- Sound effects (8-bit style)
- Simple sprites or pixel art for players
- Difficulty levels (AI skill sliders)
- Mobile touch controls
- Replays / goal celebration animation

---

## Current Priority: Make It Fun

The formation grid and team system are in place. The next focus is **making each player feel distinct** and the game feel fun to play. Specifically:

1. **Player attributes.** Speed, reaction time, and paddle size should vary by player quality. Maradona and Baggio should feel special. Baresi should be a wall. Maldini fast. Caniggia the quickest on the pitch. Right now everyone is basically identical with different labels.

2. **Formation behavior.** Defenders should shift as a back line. Midfield should compress/expand with ball position. Forwards should make runs into space, not just track ball.y. The formation should feel alive, not static.

3. **AI shooting.** Schillaci (AI main forward) should time runs, position for through-balls, and vary between flat shots and lobs. He's too predictable.

4. **Use Physics Lab** to test any mechanic changes before touching Match mode.

5. **Push after each meaningful change** so the game can be tested live at pongball.io.

---

## Working With This Codebase

- **Everything is in `index.html`.** One file. Edit it, push, it's live.
- **Test at pongball.io** — Cloudflare Pages deploys on push to main.
- **Constants are at the top** — easy to tune without reading the whole file.
- **The `gameMode` variable** controls menu/match/physics flow. The main loop checks it.
- **ESC** always returns to menu from any mode.
- **Ratio-based sizing** — never use absolute pixel values for game objects. Always `W * ratio` or `H * ratio`.
- **Don't add dependencies.** No npm, no build step, no external JS. Keep it inline.
