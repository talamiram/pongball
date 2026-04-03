// Canvas dimensions
export const CANVAS_W = 1000;
export const CANVAS_H = 600;

// Scoreboard / HUD
export const HUD_H = 52;

// Field boundaries
export const FIELD_TOP = HUD_H + 4;
export const FIELD_BOTTOM = CANVAS_H - 4;
export const FIELD_LEFT = 4;
export const FIELD_RIGHT = CANVAS_W - 4;
export const FIELD_W = FIELD_RIGHT - FIELD_LEFT;
export const FIELD_H = FIELD_BOTTOM - FIELD_TOP;
export const FIELD_MID_X = CANVAS_W / 2;
export const FIELD_MID_Y = (FIELD_TOP + FIELD_BOTTOM) / 2;

// Goals
export const GOAL_W = 14;
export const GOAL_H = 160;
export const GOAL_TOP = FIELD_MID_Y - GOAL_H / 2;
export const GOAL_BOTTOM = FIELD_MID_Y + GOAL_H / 2;
export const GOAL_LEFT_X = FIELD_LEFT;
export const GOAL_RIGHT_X = FIELD_RIGHT - GOAL_W;

// Paddle dimensions
export const GK_W = 14;
export const GK_H = 80;
export const OF_W = 14;
export const OF_H = 70;

// Paddle X positions (fixed)
export const LEFT_GK_X = FIELD_LEFT + GOAL_W + 4;       // ~22
export const LEFT_OF_X = 270;
export const RIGHT_GK_X = FIELD_RIGHT - GOAL_W - 4 - GK_W; // ~968
export const RIGHT_OF_X = CANVAS_W - 270 - OF_W;

// Outfield roam zones (x range)
export const LEFT_OF_XMIN = LEFT_GK_X + GK_W + 2;
export const LEFT_OF_XMAX = FIELD_MID_X - OF_W - 2;
export const RIGHT_OF_XMIN = FIELD_MID_X + 2;
export const RIGHT_OF_XMAX = RIGHT_GK_X - OF_W - 2;

// GK Y roam (center of paddle clamped here)
export const GK_YMIN = FIELD_TOP + 2;
export const GK_YMAX = FIELD_BOTTOM - GK_H - 2;

// OF Y roam
export const OF_YMIN = FIELD_TOP + 2;
export const OF_YMAX = FIELD_BOTTOM - OF_H - 2;

// Ball
export const BALL_RADIUS = 12;
export const BALL_INITIAL_SPEED = 310;   // px/s
export const BALL_MAX_SPEED = 680;
export const BALL_SPEED_INC = 1.03;      // multiply per paddle hit
export const BALL_TRAIL_LEN = 7;

// Player speeds (px/s)
export const GK_SPEED = 400;
export const OF_SPEED = 370;

// Match rules
export const MATCH_DURATION = 90;        // seconds (real-time = 90s)
export const OT_DURATION = 30;           // overtime seconds
export const GOALS_TO_WIN_PENALTY = 5;   // penalty shootout kicks
export const GOAL_PAUSE = 2.2;           // seconds pause after goal
export const KICKOFF_COUNTDOWN = 3;      // seconds

// AI difficulty per round bonus
export const AI_ROUND_BONUS = 0.04;
export const AI_MAX_DIFFICULTY = 0.97;

// Colors
export const COLOR_FIELD_DARK = '#1a6e28';
export const COLOR_FIELD_LIGHT = '#1d7a2d';
export const COLOR_CHALK = '#ffffff';
export const COLOR_GOAL_POST = '#dddddd';
export const COLOR_HUD_BG = '#111111';
export const COLOR_TEXT = '#ffffff';
export const COLOR_ACTIVE_GLOW = '#ffff00';

// Font sizes (px)
export const FONT_SM = 8;
export const FONT_MD = 11;
export const FONT_LG = 16;
export const FONT_XL = 22;
export const FONT_TITLE = 32;
