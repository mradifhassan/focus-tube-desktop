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
    this.bumpDataRevision();
  },

  // Synchronous stub used at construction time so the app boots immediately
  // without blocking the main thread on a large JSON.parse of the full catalog.
  // The real catalog is hydrated asynchronously via loadCatalogAsync().
  loadCatalog() {
    return {};
  },

  // Hydrate dataCache asynchronously after first paint. Reads from localStorage
  // cache if it's fresh (matches CATALOG_VERSION), otherwise falls back to the
  // built-in BUILTIN_CATALOG. Resolves with the catalog object so callers can
  // assign it to this.dataCache and bump the data revision.
  async loadCatalogAsync() {
    let catalog = {};

    const cachedVersion = localStorage.getItem('yt_catalog_version');
    if (cachedVersion === String(CATALOG_VERSION)) {
      const saved = localStorage.getItem('yt_catalog_cache');
      if (saved) {
        try { catalog = JSON.parse(saved); } catch (e) { catalog = {}; }
      }
    }

    if (!catalog || Object.keys(catalog).length === 0) {
      catalog = JSON.parse(JSON.stringify(BUILTIN_CATALOG));
      try {
        localStorage.setItem('yt_catalog_cache', JSON.stringify(catalog));
        localStorage.setItem('yt_catalog_version', String(CATALOG_VERSION));
      } catch (e) {}
    }

    return catalog;
  },

  saveCatalog() {
    localStorage.setItem('yt_catalog_cache', JSON.stringify(this.dataCache));
    this.bumpDataRevision();
  },
};