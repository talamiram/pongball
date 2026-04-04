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

Pong, but football. **One paddle per team** that moves freely around its half. The paddle's identity (name, number, neon color) changes based on its position zone — in the box you're the keeper, in defense you're Ruggeri, in midfield you're Burruchaga, up front you're Maradona.

**Without Space:** Ball bounces off your paddle. Normal Pong deflection — angle depends on where the ball hits (center = straight, edge = steep). Works the same in every zone.

**With Space:** Zone-specific signature move, each with a risk/reward "too much" punishment:

| Zone | Identity | Space Action | Risk (too much) |
|---|---|---|---|
| **Box** (goal area) | Goycochea | **Catch & hold** — aim with arrows, release to distribute | Stuck holding, opponent pressures |
| **DEF** | Ruggeri, etc. | **Lob clearance** — launches high and long, arrows control direction | Hold too long → comically high, wastes time |
| **MID** | Burruchaga, etc. | **Curving shot** — ball curves in arrow direction at the end | Too much arrow → curves out of bounds or misses |
| **FWD** | Maradona, etc. | **Power blast** — upper corner rocket, Space = power | Hold too long → ball goes over the bar |

The core tactical tension: push forward for better attacks but leave your goal exposed. Hang back to defend but you can't score. Read the play, choose your position.

**Goal posts** define a goal mouth (30% of screen height, centered). Ball must enter the goal mouth to score — including lobbed balls that fly in. Shots that miss hit the post or wall and bounce back.

---

## Controls

| Input | Action |
|---|---|
| Arrow keys (up/down) | Move paddle vertically |
| Arrow keys (left/right) | Move paddle horizontally (free movement within your half) |
| Space (no ball contact) | Pre-charge for zone ability |
| Space (on contact) | Triggers zone-specific move (see table above) |

**No control switching.** You control one paddle at all times. When you enter the box, the paddle shifts to keeper neon color — that's your visual cue that Space = catch.

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
held_player → (Space release or 2s auto) → live
held_ai → (AI timer or 2s auto) → live
live → (hits player paddle, Space NOT held) → bounce (normal Pong deflection)
live → (hits player paddle, Space IS held, in BOX) → held_player (CATCH)
live → (hits player paddle, Space IS held, in DEF) → live (LOB CLEARANCE)
live → (hits player paddle, Space IS held, in MID) → live (CURVING SHOT)
live → (hits player paddle, Space IS held, in FWD) → live (POWER BLAST)
live → (hits AI paddle) → AI zone logic
live → (enters goal mouth on ground) → held_player or held_ai (restart from box)
```

States:
- **live**: Ball is in play, physics running, collisions active.
- **held_player**: Ball stuck to front of player's paddle (only happens in box/keeper zone). Player can move, aim, and release with Space. Auto-releases after `HOLD_TIME_LIMIT` (2.0s).
- **held_ai**: Ball stuck to front of AI's paddle (only when AI is in their box). AI aims briefly then releases after 0.4–1.2s.

**After a goal:** Ball restarts with the conceding team. Their paddle starts in the box (keeper zone) with the ball held. They aim and release to restart play — this replaces the old GK serve mechanic.

---

## Teams: Italia 90

### Italy (Left, Dark Blue #003DA5) — Player's Team

| # | Name | Role | Formation Zone |
|---|---|---|---|
| 1 | Zenga | GK (box zone) | Goal area |
| 2 | Bergomi | DEF | Back 4, top |
| 6 | Baresi (C) | DEF | Back 4 |
| 5 | Ferri | DEF | Back 4 |
| 3 | Maldini | DEF | Back 4, bottom |
| 7 | Donadoni | MID | Midfield 4, top |
| 8 | De Napoli | MID | Midfield 4 |
| 16 | Berti | MID | Midfield 4 |
| 11 | Giannini | MID | Midfield 4, bottom |
| **19** | **Schillaci** | **FWD** | **Forward zone** |
| 15 | Baggio | FWD | Forward zone |

### Brazil (Right, Yellow #FFDF00) — AI Team

| # | Name | Role | Formation Zone |
|---|---|---|---|
| 1 | Taffarel | GK (box zone) | Goal area |
| 2 | Jorginho | DEF | Back 4, top |
| 4 | Dunga (C) | DEF | Back 4 |
| 3 | Ricardo Gomes | DEF | Back 4 |
| 6 | Branco | DEF | Back 4, bottom |
| 5 | Alemão | MID | Midfield 4, top |
| 8 | Valdo | MID | Midfield 4 |
| 15 | Mazinho | MID | Midfield 4 |
| 17 | Silas | MID | Midfield 4, bottom |
| **11** | **Romário** | **FWD** | **Forward zone** |
| 9 | Careca | FWD | Forward zone |

Note: Brazil's 1990 squad. They were eliminated by Argentina in the Round of 16 (Maradona assist to Caniggia). Using them here as the AI opponent for Italy.

---

## The Formation Grid (Identity System)

**One paddle per team.** The 4-4-2 formation defines **zones** on the field. As the paddle moves through zones, its displayed identity (name, number) updates to match the player assigned to that zone. The paddle's **neon color shifts to keeper colors** when in the box — this is the key visual cue.

**Zone x-ranges (ratio of screen width, left team):**
```
BOX zone:  0.00 – 0.05   →  Goycochea (keeper colors, Space = catch)
DEF zone:  0.05 – 0.22   →  Giusti / Serrizuela / Ruggeri / Olarticoechea
MID zone:  0.22 – 0.38   →  Simón / Basualdo / Burruchaga / Calderón
FWD zone:  0.38 – 0.50   →  Maradona / Caniggia
```

**Within each zone, y-position picks the specific player.** The 4-player lines (DEF, MID) are split into vertical bands at 0.15, 0.38, 0.62, 0.85. The 2-player lines (FWD) split at 0.37, 0.63.

**Example:** Your paddle is at x=0.15, y=0.70 → DEF zone, lower half → you're "Olarticoechea #16" with lob clearance ability. You sprint forward to x=0.42 → now you're "Maradona #10" with power blast. You rush back to x=0.03 → keeper colors activate, you're "Goycochea #12" and can catch.

**Why this matters:**
- Commentary: "Goal scored by Maradona!" vs "Goal scored by Burruchaga!" based on where the shot came from
- Stats tracking: goals per player, even though it's one paddle
- Zone-specific abilities give each position a distinct feel
- The keeper color shift is instant UX — you know you can catch without any tutorial

---

## Paddle Sizes

**One paddle per team**, same size for both. No size changes between zones — the paddle stays constant. Only the identity, neon color, and Space ability change.

All sizes are responsive (height as ratio of screen H):

| Paddle | Width (px) | Height (ratio of H) |
|---|---|---|
| Paddle (both teams) | 7 | 0.05 |

---

## Collision & Physics

**Sub-stepped physics** to prevent tunneling: each frame's movement is divided into steps no larger than `ball.size * 0.5` pixels.

**Paddle collision (no Space):** Ball bounces off the paddle face. Normal Pong deflection. Exit angle is determined by where the ball hits the paddle (center = straight, edge = steep angle, up to `MAX_BOUNCE_ANGLE = π/3`). Speed increases by `BALL_ACCEL = 1.02×` on each hit, capped at `W * BALL_MAX_SPEED`.

**Paddle collision (Space held):** Zone-specific move triggers instead of a bounce. See Core Concept table for what each zone does.

**Goal posts:** Physical rectangles at top and bottom of goal mouth. Ball bounces off posts and off the back wall outside the goal mouth. Goals only count when ball crosses the goal line within the mouth AND is on the ground (not airborne).

**Wall bounces:** Top and bottom screen edges bounce the ball with 0.97 damping.

---

## AI Paddle

The AI team has **one paddle** that works the same zone system. The AI decides where to position itself based on game state:

- **Ball moving toward AI goal:** AI retreats to box (keeper mode), tracks ball y to block shots
- **Ball in AI's half, not immediate threat:** AI positions in DEF/MID zone, uses zone-appropriate abilities
- **Ball in player's half (AI attacking):** AI pushes to FWD zone, looks for power blast or curving shot opportunities
- **AI holds ball (caught in box):** Aims briefly then distributes after 0.4–1.2s

AI `skill` parameter (0–1) controls tracking speed and decision quality. Higher skill = faster reactions, better positioning choices, more accurate shots.

---

## Visual Direction: Neon Arcade Table

The visual target is the **Atari Pong arcade coffee table** — dark surface, neon-colored edges, glowing elements, clean minimalism. Think arcade, not FIFA. The game should look like it's being played on a glowing table in a dark room.

### Surface & Field

**Background:** Near-black surface (#080808 to #0a0a0a). NOT green. This is an arcade table, not a grass pitch. The playing surface should feel like dark glass or matte black.

**Field lines:** Thin, glowing neon lines instead of painted markings. Use `shadowBlur` and bright colors (cyan, white, or soft blue) for a neon tube effect. Center line (dashed), center circle, penalty areas, goal areas, field border — all rendered as glowing lines on the dark surface. Keep them subtle — they should frame the action, not dominate it.

**Goal mouths:** Neon-lit goal posts. Bright white or team-colored glow. The goal area should feel like a lit-up target zone.

### Paddles

**Neon paddles** in team colors — Argentina light blue (#75AADB), Italy dark blue (#003DA5). Each paddle should have a strong glow effect (`shadowBlur` with team color, multiple passes for intensity). The paddle itself is a clean rectangle, but the glow makes it feel electric.

**Player-controlled paddle** gets a brighter, more intense glow — like it's "powered up" compared to AI paddles. Shirt number displayed above in small monospace text, also glowing.

### Ball

**Glowing white ball** with a light trail. The ball should have a bright white core with a soft white/cyan glow (`shadowBlur`). As it moves, it should leave a fading trail (store last N positions, draw with decreasing opacity) — like a light streak across the dark table.

When airborne: drawn offset upward by `ball.z` pixels, scales up slightly (`1 + z/300`), and casts a dim ground shadow (ellipse, low opacity) that grows and fades with height. The shadow should be a subtle dark spot, not a bright glow — it's a shadow on a dark surface.

**Raised glass feel:** The playing surface should feel like it has a glass enclosure above it — like the Atari Pong coffee table. When the ball lobs, it should feel like it's rising up inside that glass box, not just floating over a flat screen. Visual cues: the ball's glow could reflect/brighten against a subtle glass edge effect at the top of the screen when it reaches peak height. The neon border strips reinforce this — they're the edges of the glass box. The ball lives inside this lit-up enclosure.

### Scoreboard & HUD

**Scoreboard** at top center: team short codes in neon team colors flanking the score. Score numbers should be large and glowing, like an LED display. Think digital clock / arcade score aesthetic.

**HUD elements:** Keep the existing functionality but style them neon:
- Hold timer bar: glowing white, turns glowing red below 30%
- Charge indicator: neon green→yellow gradient with glow
- Text prompts: small, clean, slightly glowing — not intrusive

### Field Border Glow

The outer edge of the playing field should have a **subtle neon border glow** — like the LED strips on the Atari Pong table. This can be team-colored (Argentina's color on the left half, Italy's on the right) or a neutral cyan/white. This border glow frames the entire playing surface and is the strongest visual anchor.

### Key Principles

1. **Dark background, bright elements.** Everything that matters glows. The surface is just darkness.
2. **Glow is the primary visual language.** Use `shadowBlur` generously on canvas. Multiple shadow passes for intensity.
3. **Minimal, clean shapes.** Paddles are rectangles, ball is a circle, lines are thin. The glow does the visual work, not complexity.
4. **Team colors through light.** Argentina and Italy aren't painted — they're lit up. Their colors come from neon glow.
5. **No textures, no gradients on surfaces.** This is flat dark + neon glow. Keep it simple.

---

## Intro Cutscene

When a match starts (player selects Match Mode or Physics Lab from menu), play a brief **zoom-in cutscene** before gameplay begins. The reference image is the PONGBALL Italia '90 arcade coffee table — black body, white PONG-style logo, Italian flag stripe detail, neon LED border strips on the playing surface, glass top.

### The Sequence

1. **3D table view (~1s):** Show the arcade table from an angled perspective — like looking at a coffee table from a seated position. This is a **CSS 3D transform or canvas fake-perspective** of the playing surface: the field is drawn as a trapezoid (narrower at top, wider at bottom) with the neon border glow visible, the "PONGBALL" branding, and the dark glass surface. Paddles are in starting positions. The table body (black rectangle with legs) frames the playing surface. This should feel like a physical object in a room.

2. **Zoom & flatten (~1.5–2s):** Smoothly transition from the angled 3D view to a flat top-down view. The perspective flattens, the table body disappears off the edges, and we settle into the normal gameplay view — just the playing surface filling the screen. Use CSS `perspective` + `rotateX` animating to 0, or canvas `setTransform()` interpolation.

3. **Team names flash:** As the zoom completes, flash "ARGENTINA vs ITALY" in large neon team colors, centered, then fade out over ~0.5s.

4. **Ball spawns:** After the transition, the ball appears on the serving GK and gameplay begins.

### Visual Details for the Table View

- **Table body:** Black rectangle with subtle legs visible at the bottom corners
- **Branding:** "PONGBALL" in large white block letters on the table front, "ITALIA '90" underneath with a small Italian flag stripe (green-white-red)
- **Playing surface:** Dark glass with the neon field lines visible through it
- **Border LED strips:** The neon border glow should be the most prominent visual — cyan/team-colored strips running around the inside edge of the playing surface, exactly like the Atari Pong table
- **Score display:** Small LED-style score visible at the top of the table surface

### Implementation Notes

- The cutscene should be **skippable** (press Space or Enter to skip straight to gameplay)
- Keep it short and punchy — this is an arcade game, not a movie
- Use a `cutsceneTimer` that counts down during the cutscene phase
- The main game loop checks if `gameMode === 'cutscene'` and renders the transition instead of normal gameplay
- Once the timer expires (or player skips), switch to normal `gameMode = 'match'` or `'physics'`
- Consider using a separate `<div>` overlay with CSS 3D transforms for the table view, then fading it out to reveal the canvas underneath — this may be simpler than doing perspective transforms on the canvas itself

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
4. Visual style needs to match neon arcade direction (see Rendering section)
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
4. **Pong DNA.** Vertical paddles, ball bouncing, that satisfying deflection feel. The football layer adds formation and lobbing, but underneath it's still Pong. Visually: neon arcade table, not FIFA.
5. **Neon arcade aesthetic.** Dark surface, glowing elements, clean shapes. Inspired by the Atari Pong coffee table. Everything that matters glows.
5. **Iterate fast.** Edit → push → live in 60 seconds. Test in browser, not in code.

---

## Roadmap Ideas (Not Started)

- Team selection screen (multiple World Cup squads)
- Tournament mode (group stage → knockout)
- 2-player mode (WASD + QE for second player)
- Player switching (tab between your formation players)
- Set pieces (corners, free kicks)
- Sound effects (8-bit style)
- Goal celebration animation (neon flash, screen shake)
- Difficulty levels (AI skill sliders)
- Mobile touch controls
- Replays

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
