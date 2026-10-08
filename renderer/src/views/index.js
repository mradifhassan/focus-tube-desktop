/**
 * @file views/index.js
 * Aggregates every page-view mixin into one so FreeTubeApp can be built up
 * with a single Object.assign call.
 */

import { homeViewMixin } from './home.js';
import { searchViewMixin } from './search.js';
import { channelViewMixin } from './channel.js';
import { libraryViewMixin } from './library.js';
import { playlistViewMixin } from './playlist.js';
import { watchViewMixin } from './watch.js';
import { isolatedViewMixin } from './isolated.js';

export const viewsMixin = Object.assign(
  {},
  homeViewMixin,
  searchViewMixin,
  channelViewMixin,
  libraryViewMixin,
  playlistViewMixin,
  watchViewMixin,
  isolatedViewMixin
);