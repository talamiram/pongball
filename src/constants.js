// Canvas dimensions (classic 4:3 Pong proportions)
export const CANVAS_W = 960;
export const CANVAS_H = 540;

// Scoreboard / HUD
export const HUD_H = 40;

// Field boundaries
export const FIELD_TOP = HUD_H;
export const FIELD_BOTTOM = CANVAS_H;
export const FIELD_LEFT = 0;
export const FIELD_RIGHT = CANVAS_W;
export const FIELD_W = FIELD_RIGHT - FIELD_LEFT;
export const FIELD_H = FIELD_BOTTOM - FIELD_TOP;
export const FIELD_MID_X = CANVAS_W / 2;
export const FIELD_MID_Y = (FIELD_TOP + FIELD_BOTTOM) / 2;

// Goals (full height of field — classic Pong style)
export const GOAL_W = 8;
export const GOAL_H = FIELD_H;
export const GOAL_TOP = FIELD_TOP;
export const GOAL_BOTTOM = FIELD_BOTTOM;
export const GOAL_LEFT_X = FIELD_LEFT;
export const GOAL_RIGHT_X = FIELD_RIGHT - GOAL_W;

// Paddle dimensions — small, classic feel
export const GK_W = 10;
export const GK_H = 50;
export const OF_W = 10;
export const OF_H = 40;

// Paddle X positions (fixed for GK, default for OF)
export const LEFT_GK_X = 20;
export const LEFT_OF_X = 240;
export const RIGHT_GK_X = CANVAS_W - 20 - GK_W;
export const RIGHT_OF_X = CANVAS_W - 240 - OF_W;

// Outfield roam zones (x range)
export const LEFT_OF_XMIN = LEFT_GK_X + GK_W + 10;
export const LEFT_OF_XMAX = FIELD_MID_X - OF_W - 10;
export const RIGHT_OF_XMIN = FIELD_MID_X + 10;
export const RIGHT_OF_XMAX = RIGHT_GK_X - OF_W - 10;

// GK Y roam (center of paddle clamped here)
export const GK_YMIN = FIELD_TOP;
export const GK_YMAX = FIELD_BOTTOM - GK_H;

// OF Y roam
export const OF_YMIN = FIELD_TOP;
export const OF_YMAX = FIELD_BOTTOM - OF_H;

// Ball
export const BALL_RADIUS = 5;
export const BALL_INITIAL_SPEED = 340;   // px/s
export const BALL_MAX_SPEED = 720;
export const BALL_SPEED_INC = 1.04;      // multiply per paddle hit
export const BALL_TRAIL_LEN = 0;         // no trail — clean

// Player speeds (px/s)
export const GK_SPEED = 380;
export const OF_SPEED = 340;

// Match rules
export const MATCH_DURATION = 90;        // seconds
export const OT_DURATION = 30;           // overtime seconds
export const GOALS_TO_WIN_PENALTY = 5;   // penalty shootout kicks
export const GOAL_PAUSE = 1.5;           // seconds pause after goal
export const KICKOFF_COUNTDOWN = 2;      // seconds

// AI difficulty per round bonus
export const AI_ROUND_BONUS = 0.04;
export const AI_MAX_DIFFICULTY = 0.97;

// Colors — minimal
export const COLOR_FIELD_DARK = '#000000';
export const COLOR_FIELD_LIGHT = '#000000';
export const COLOR_CHALK = '#ffffff';
export const COLOR_GOAL_POST = '#ffffff';
export const COLOR_HUD_BG = '#000000';
export const COLOR_TEXT = '#ffffff';
export const COLOR_ACTIVE_GLOW = '#ffff00';

// Font sizes (px)
export const FONT_SM = 8;
export const FONT_MD = 10;
export const FONT_LG = 14;
export const FONT_XL = 20;
export const FONT_TITLE = 28;
