/**
 * @file config.js
 * App-wide constants and versioning.
 */

// Bump whenever CODEBASE_SUBSCRIBED_CHANNELS or BUILTIN_CATALOG changes.
// The app compares this against what's cached in localStorage and refreshes
// the cache automatically when it's out of date, so fixes here always reach
// users instead of being hidden behind an old cached copy forever.
//
// v2 -> v3: catalog restructured & fixed (moved misplaced OnnoRokom videos
// and playlists out of Alchemy; normalized channelID -> channelId field name).
// v12 -> v13: added OnnoRokom "Permutation & Combination" playlist (26 videos).
// v13 -> v14: added OnnoRokom "Integration" playlist (24 videos).
// v14 -> v15: added OnnoRokom "Electrochemistry" playlist (14 videos).
// v15 -> v16: added OnnoRokom "Gas Laws" playlist (7 videos).
// v16 -> v17: added OnnoRokom "Economic Chemistry" playlist (14 videos).
// v17 -> v18: added OnnoRokom "Application Oriented Chemistry" playlist (19 videos).
// v18 -> v19: added OnnoRokom "Qualitative Chemistry" playlist (34 videos).
// v19 -> v20: added OnnoRokom "Chemical Changes" (18) + "Quantitative Chemistry" (15) playlists.
export const CATALOG_VERSION = 20;