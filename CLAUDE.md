# PongBall — Game Bible

> A Pong-meets-football arcade game. Italy vs Brazil, Italia '90.
> Live at **pongball.io** — deployed via Cloudflare Pages on push to `main`.

---

## Architecture

**Single-file game.** Everything lives in `index.html` — inline CSS, inline JS, no build step, no dependencies. The old `src/` folder with 30+ module files is legacy and NOT used.

**Deployment pipeline:** Edit `index.html` → `git push origin main` → Cloudflare Pages auto-deploys → live at pongball.io within ~60 seconds.

**Git remote uses a fine-grained PAT** embedded in the origin URL. The token has Contents: Read/Write permission scoped to `talamiram/pongball` only.

**Canvas-based rendering.** Full-screen responsive canvas (`window.innerWidth` x `window.innerHeight`). All sizes are ratio-based (percentage of W or H) so the game scales to any screen.

**Perspective transform system.** Game logic runs in a flat rectangular coordinate space (0,0 to W,H). The `toScreen(gx, gy)` function maps game coords to a perspective trapezoid for rendering. `perspScaleAt(gy)` returns scale factor at a given y. This keeps physics simple while visuals look 3D.

---

## Core Concept

Pong, but football. Two teams with **2 paddles each** (GK + 1 outfield). The outfield paddle's **identity changes** based on field position (see Zone Identity System). Pure Pong deflection — ball bounces off paddles, no catching for outfield. Only GKs can catch (probabilistically).

**Core mechanics:**
1. **Pong deflection**: Ball bounces off any paddle. Angle depends on where ball hits paddle face.
2. **Directed shot**: Hold Space during deflection + arrow keys = aim the shot + add lob height.
3. **Shot sweet spot**: Medium charge (0.15–0.4s) = 1.5x speed "power shot" for top corners. Long charge = pure high lob, less forward speed.

**Goal posts** define a goal mouth (30% of screen height, centered). Goals sit ON the grass at `GOAL_LINE_RATIO = 0.02` from each edge. Ball must enter the goal mouth to score.

---

## Controls

| Input | Action |
|---|---|
| Arrow keys (up/down) | Move controlled paddle vertically + aim shots |
| Arrow keys (left/right) | Move controlled paddle horizontally (outfield only) |
| Space (tap + release) | Flat serve / flat pass (when on GK) |
| Space (hold + release) | Lob — longer hold = higher ball |
| Space held on deflection | **Directed shot** — arrows aim, charge controls lob height |
| Arrow Down during shot | Cancel lob — hard flat drive |
| Arrow Up during shot | Boost lob — extra height |

**Control switching:** When ball is on your GK (serve state), arrow keys move the GK up/down to aim the serve. The instant Space is released (serve happens), control switches back to your forward (Schillaci).

---

## The Lob Mechanic (Critical Design)

This is the core skill mechanic. **Press duration ONLY affects height (z-axis).**

- `ball.vz = chargeTime * H * LOB_POWER` (LOB_POWER = 1.2)
- Speed modulated by `shotSpeedMult(charge)` — sweet spot at 0.15–0.4s gives 1.5x speed
- Gravity (`GRAVITY = 500 px/s`) pulls it back down in a natural arc
- Ball visually rises (drawn offset upward by `ball.z` pixels), grows slightly (scale), and casts a ground shadow
- **Airborne ball (z > AIR_THRESHOLD = 10) flies over ALL paddles** — no collisions, no catches, no goals
- Ball can only be deflected or score when `ball.z ~ 0` (on the ground)
- If airborne ball crosses the goal line, it bounces back (went "over the goal")
- Arrow Down during shot = cancel lob (hard flat drive). Arrow Up = boost lob 1.4x.

---

## Ball State Machine

```
on_gk → (Space release) → live
live → (hits GK, catch succeeds) → on_gk
live → (hits any paddle) → live (deflection — pure Pong bounce)
live → (enters goal mouth) → on_gk (after goal pause)
```

States:
- **on_gk**: Ball stuck to front of serving GK. Player aims GK with arrows, releases with Space. AI serves after random delay (0.6–1.4s) with slight random lob.
- **live**: Ball is in play, physics running, collisions active. All paddles deflect like Pong. GK has probabilistic catch (player GK 60%, AI GK 50%). Space held during outfield deflection = directed shot with lob control.

There are NO `held_player` or `held_ai` states. Outfield paddles never catch — they only deflect.

---

## Teams: Italia '90

### Italy (Left, Dark Blue #003DA5) — Player's Team

| # | Name | Role | Notes |
|---|---|---|---|
| 1 | Zenga | GK | Player's goalkeeper |
| 2 | Bergomi | DEF | Zone identity |
| 6 | Baresi (C) | DEF | Zone identity |
| 5 | Ferri | DEF | Zone identity |
| 3 | Maldini | DEF | Zone identity |
| 7 | Donadoni | MID | Zone identity |
| 8 | De Napoli | MID | Zone identity |
| 16 | Berti | MID | Zone identity |
| 11 | Giannini | MID | Zone identity |
| **19** | **Schillaci** | **FWD** | **Player-controlled forward** |
| 15 | Baggio | FWD | Zone identity |

### Brazil (Right, Yellow #FFDF00) — AI Team

| # | Name | Role | Notes |
|---|---|---|---|
| 1 | Taffarel | GK | AI goalkeeper |
| 2 | Jorginho | DEF | Zone identity |
| 3 | Ricardo Gomes | DEF | Zone identity |
| 4 | Mauro Galvao | DEF | Zone identity |
| 6 | Branco | DEF | Zone identity |
| 8 | Dunga (C) | MID | Zone identity |
| 5 | Alemao | MID | Zone identity |
| 10 | Valdo | MID | Zone identity |
| 7 | Muller | MID | Zone identity |
| **11** | **Careca** | **FWD** | **AI main forward** |
| 20 | Bebeto | FWD | Zone identity |

---

## The Zone Identity System

**There are NOT 11 paddles per side.** Each team has exactly **2 paddles**: one GK and one outfield player. The outfield paddle's identity (name, number) changes based on where it is on the field.

The 4-4-2 formation defines **zones**. When the paddle is in a zone, it "becomes" the player assigned to that zone. The paddle's displayed name and number update in real-time.

**Zone x-ranges (ratio of screen width, left team):**
```
DEF zone:  0.00 – 0.22   →  Bergomi / Baresi / Ferri / Maldini
MID zone:  0.22 – 0.38   →  Donadoni / De Napoli / Berti / Giannini
FWD zone:  0.38 – 0.50   →  Schillaci / Baggio
```

**Within each zone, y-position picks the specific player.** The 4-player lines (DEF, MID) split at y-bands [0.265, 0.50, 0.735]. The 2-player lines (FWD) split at y = 0.50.

**The AI outfield paddle works the same way** — mirrored x-zones for the right team.

**Why this matters:**
- Commentary: "Goal scored by Schillaci!" vs "Goal scored by Baggio!" based on position
- Stats tracking per player even though it's one paddle
- Feels like a full team without the chaos of 22 paddles
- GK identity is always fixed (Zenga / Taffarel)

---

## Paddle Sizes

Each team has exactly **2 physical paddles**: one GK and one outfield. Both teams' outfield paddles are the **same size**.

| Paddle | Width (px) | Height (ratio of H) |
|---|---|---|
| GK | 16 | 0.08 |
| Outfield (both teams) | 16 | 0.08 |

Paddles render as chunky white 3D blocks (blockH = 28) with two team color stripes on the top face. Labels (`#NUM NAME`) appear below in monospace text.

---

## Collision & Physics

**Sub-stepped physics** to prevent tunneling: each frame's movement is divided into steps no larger than `ball.size * 0.5` pixels.

**Paddle collision:** Ball bounces off the paddle face. Exit angle determined by hit position (center = straight, edge = steep, up to `MAX_BOUNCE_ANGLE = PI/3`). Speed increases by `BALL_ACCEL = 1.03x` on each hit, capped at `W * BALL_MAX_SPEED (0.60)`.

**GK catch:** When ball hits a GK, there's a probability-based catch: player GK 60%, AI GK 50%. If caught, ball goes to `on_gk` state. If not caught, ball deflects like a normal paddle hit.

**Directed shot on deflection:** If Space is held when ball hits the player's outfield paddle, arrows aim the shot and charge time controls lob height. `shotSpeedMult(charge)` gives 1.0–1.5x speed boost (sweet spot 0.15–0.4s).

**Goal lines:** At `W * GOAL_LINE_RATIO (0.02)` from each edge — goals sit ON the grass, not at screen edges. Goal posts are physical rectangles at top/bottom of goal mouth. Ball bounces off posts.

**Wall bounces:** Top and bottom screen edges bounce the ball with 0.97 damping. Side walls at goal line positions bounce with 0.7 damping outside goal mouth.

---

## GK AI

Both goalkeepers use the same AI with a `skill` parameter (0–1):

- `GK_SKILL_LEFT = 0.72` (Zenga — player's GK, slightly better)
- `GK_SKILL_RIGHT = 0.68` (Taffarel)

Higher skill = faster tracking, less lag. GK tracks ball y when ball is moving toward their goal, returns to center otherwise. Movement is smoothed with a lag factor.

Left GK AI is **skipped** when `ballState === 'on_gk' && serveFromLeft` — player controls the GK during serve.

---

## Outfield AI

The AI outfield paddle (right team) uses reaction-based tracking:

1. Track ball y-position with reaction-weighted lag
2. X-movement: push forward when ball is on opponent's side, retreat when defending
3. Clamped to right half of field (`W * 0.52` to GK position)
4. Occasionally adds a small random lob on deflection (20% chance)

Zone identity stats (speed, reaction) from the current position affect tracking responsiveness.

---

## Visual Direction: Atari Coffee Table

The visual target is the **Atari Pong arcade coffee table** — dark surface, perspective 3D field, chunky white paddles, shiny football, glass overlay.

### Surface & Field

**Background:** Near-black (#0a0a0a). Dark like an arcade cabinet surface.

**Field:** Perspective trapezoid (wider at bottom = closer to viewer). Green grass with alternating dark/light stripes. White field markings (center line, center circle, penalty areas, goal areas, penalty arcs).

**3D base:** Dark wood-tone sides visible below the field surface (front face and right side).

**Field border:** Dark brown frame (#3a2e24) between grass and 3D base edge.

### Paddles

**Chunky white 3D blocks** with team color stripes. Each paddle is rendered with three visible faces (top, front, right side) for a solid 3D appearance. Two thin team-colored stripes on the top face (15% from each end). Perspective-mapped using `toScreen()`.

Italy paddles: dark blue (#003DA5) stripes. Brazil paddles: yellow (#FFDF00) stripes.

### Ball

**Shiny football** with pentagon pattern. Radial gradient (white center → gray edge) for 3D shading. Small dark pentagon shapes for the classic football look. Glossy highlight (radial white glow, upper-left). Subtle dark outline.

When airborne: drawn offset upward by `ball.z * scale` pixels, scales up slightly, casts an elliptical ground shadow that fades with height.

### Goals

**3D wireframe goals** in perspective. Gray/silver posts and crossbar (4px). Net mesh rendered as thin lines connecting front posts to back corners. Net includes side nets, back net (vertical + horizontal lines), and roof net. Goals sit ON the grass at GOAL_LINE_RATIO from edges.

### Scoreboard & HUD

**Scoreboard** at top-left: team codes in lighter team colors (light blue for ITA, gold for BRA) flanking a white score. Monospace font.

**Charge indicator:** Small bar near ball when Space is held, green-to-red gradient.

### Glass Overlay

**Arcade glass effect** drawn on top of everything in match mode:
- Subtle top-to-bottom gradient (very low opacity white)
- Diagonal light streak (like overhead light reflecting on glass)
- Radial vignette (dark corners)

### Italia '90 Logo

Programmatic logo (deconstructed football with green/red Italian flag accents) drawn at 65% x, scale 0.85. "ITALIA'90" text below in light cream on dark background.

---

## Fly-In Animation

When Match mode starts, the field zooms in from a distant view over 1.5 seconds:

- `flyInProgress` interpolates from 0 (30% scale, offset upward) to 1 (full scale, normal position)
- Uses ease-out cubic: `1 - (1 - t)^3`
- Perspective field corners are interpolated around screen center
- Paddles, ball, and HUD only render after fly-in completes
- Scoreboard and logo render during fly-in

---

## Game Modes

The game starts on a **menu screen** (arrows + Enter, or press 1/2/3):

### Match Mode
Full perspective field, Italy vs Brazil, 4 paddles (2 per side), zone identity system. Fly-in animation on start. Glass overlay. Italia '90 logo.

### Physics Lab
Stripped-down testing mode. Dark green flat field, 3 paddles only (your GK, your forward, opposing GK). No AI forward. No perspective transform. Simple white outline ball.

Includes a **debug HUD** (top-left) showing ball speed, height, vz, peak height, last shot charge/peak, airborne status.

### World Cup
Placeholder "COMING SOON" screen. Will eventually have team selection, formations, tournament mode.

---

## Constants Reference

```
PADDLE_W_GK = 16          PADDLE_W_OF = 16
GK_H_RATIO = 0.08         OUTFIELD_H_RATIO = 0.08
BALL_SIZE = 12             BALL_SPEED = 0.30
BALL_MAX_SPEED = 0.60      BALL_ACCEL = 1.03
MAX_BOUNCE_ANGLE = PI/3    GRAVITY = 500
LOB_POWER = 1.2            AIR_THRESHOLD = 10
GOAL_HEIGHT_RATIO = 0.30   GOAL_LINE_RATIO = 0.02
POST_THICK = 6             GOAL_DEPTH = 18
GK_SKILL_LEFT = 0.72       GK_SKILL_RIGHT = 0.68
OF_SPEED_RATIO = 0.45      GK_SPEED_RATIO = 0.40
```

**Formation X positions:**
```
gkL: 0.06   defL: 0.14   midL: 0.30   fwdL: 0.43
gkR: 0.94   defR: 0.86   midR: 0.70   fwdR: 0.57
```

---

## Known Issues & Debt

1. Old `src/` folder, `style.css`, and `setup.sh` still exist in the repo — unused, can be deleted
2. AI outfield is basic — doesn't coordinate or make "runs"
3. No sound effects
4. No 2-player support yet
5. AI forward occasionally lobs randomly but doesn't have strategic shooting
6. Player can move outfield paddle anywhere in their half — no position locking
7. World Cup mode is a placeholder

---

## Design Principles

1. **Feel over features.** Get the core Pong deflection + lob system feeling right before adding anything new.
2. **Single file.** No build tools, no dependencies, no complexity. Everything inline in index.html.
3. **Ratio-based sizing.** Every dimension is a percentage of W or H. The game must look right on any screen.
4. **Pong DNA.** Vertical paddles, ball bouncing, that satisfying deflection feel. The football layer adds zone identity and lobbing, but underneath it's still Pong.
5. **Atari coffee table aesthetic.** Dark surface, perspective 3D green field, chunky white paddles, shiny football, glass overlay. Inspired by the Atari Pong coffee table.
6. **Iterate fast.** Edit -> push -> live in 60 seconds. Test in browser, not in code.

---

## Roadmap Ideas (Not Started)

- Team selection screen (multiple World Cup squads)
- Tournament mode (group stage -> knockout)
- 2-player mode (WASD + QE for second player)
- Player switching (tab between your formation players)
- Set pieces (corners, free kicks)
- Sound effects (8-bit style)
- Goal celebration animation
- Difficulty levels (AI skill sliders)
- Mobile touch controls
- Replays
- Player attributes affecting paddle behavior (speed, reaction already in data but lightly used)

---

## Working With This Codebase

- **Everything is in `index.html`.** One file. Edit it, push, it's live.
- **Test at pongball.io** — Cloudflare Pages deploys on push to main.
- **Constants are at the top** — easy to tune without reading the whole file.
- **The `gameMode` variable** controls menu/match/physics/worldcup flow. The main loop checks it.
- **ESC** always returns to menu from any mode.
- **Ratio-based sizing** — never use absolute pixel values for game objects. Always `W * ratio` or `H * ratio`.
- **Don't add dependencies.** No npm, no build step, no external JS. Keep it inline.
- **Perspective functions** (`_toScreen`, `_perspScale`) are set by `drawField()` in match mode. Other draw functions use them for positioning.
- **Zone identity** updates in real-time via `getZoneIdentity(paddle, teamData)` — pass the paddle and team data, get back the current player name/number/stats based on position.
