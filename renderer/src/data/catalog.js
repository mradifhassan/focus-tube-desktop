/**
 * @file catalog.js
 * Aggregates per-channel catalogs and exports the combined BUILTIN_CATALOG
 * keyed by YouTube channel ID.
 *
 * Bump CATALOG_VERSION in config.js whenever any catalog file changes —
 * the app uses it to refresh the localStorage cache automatically.
 */

import { ALCHEMY } from './catalog-alchemy.js';
import { LOGICALBELIEFS } from './catalog-logicalbeliefs.js';
import { ONNOROKOM } from './catalog-onnorokom.js';
import { ONEHOUR } from './catalog-onehour.js';

export const BUILTIN_CATALOG = {
  "UC8SDY8Wr6s6DIofumkZGfxg": ALCHEMY,
  "logicalbeliefs1439": LOGICALBELIEFS,
  "UCBA6OI6vEDK13jfoiuX694A": ONNOROKOM,
  "UCRmXGgiNjFfBs-t8LvF74Bw": ONEHOUR
};
