/**
 * @file storage.js
 * localStorage persistence for subscriptions and catalog cache,
 * guarded by CATALOG_VERSION so stale caches auto-refresh.
 */

import { CODEBASE_SUBSCRIBED_CHANNELS } from './data/channels.js';
import { BUILTIN_CATALOG } from './data/catalog.js';
import { CATALOG_VERSION } from './config.js';

export const storageMixin = {
  loadChannels() {
    // If the built-in catalog has been updated (CATALOG_VERSION bumped) since this
    // browser last cached its subscriptions, drop the stale cache instead of letting
    // it hide fixes/updates to the curated channel list forever.
    const cachedVersion = localStorage.getItem('yt_catalog_version');
    if (cachedVersion !== String(CATALOG_VERSION)) {
      localStorage.removeItem('yt_subscribed_channels');
      localStorage.removeItem('yt_catalog_cache');
      localStorage.setItem('yt_catalog_version', String(CATALOG_VERSION));
      return CODEBASE_SUBSCRIBED_CHANNELS;
    }

    const saved = localStorage.getItem('yt_subscribed_channels');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return CODEBASE_SUBSCRIBED_CHANNELS;
  },

  saveChannels() {
    localStorage.setItem('yt_subscribed_channels', JSON.stringify(this.subscribedChannels));
  },

  loadCatalog() {
    // Same version guard as loadChannels() — belt-and-suspenders in case call order
    // ever changes. If the cached catalog predates the current CATALOG_VERSION,
    // ignore it and rebuild fresh from the (fixed/updated) BUILTIN_CATALOG.
    const cachedVersion = localStorage.getItem('yt_catalog_version');
    if (cachedVersion !== String(CATALOG_VERSION)) {
      localStorage.removeItem('yt_catalog_cache');
      localStorage.setItem('yt_catalog_version', String(CATALOG_VERSION));
      return JSON.parse(JSON.stringify(BUILTIN_CATALOG));
    }

    const saved = localStorage.getItem('yt_catalog_cache');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return JSON.parse(JSON.stringify(BUILTIN_CATALOG));
  },

  saveCatalog() {
    localStorage.setItem('yt_catalog_cache', JSON.stringify(this.dataCache));
  },
};