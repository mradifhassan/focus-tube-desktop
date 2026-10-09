/**
 * @file api.js
 * External API layer.
 *   - Invidious API for live channel/video metadata (privacy-preserving)
 *   - YouTube oEmbed for embeddability checks
 * Helper methods are designed to be mixed into FreeTubeApp (this.dataCache, etc.).
 */

import { INVIDIOUS_INSTANCES } from './data/instances.js';
import { formatSeconds, formatNumber } from './utils.js';

const FETCH_TIMEOUT_MS = 3500;

export const apiMixin = {
  // Try every Invidious instance in PARALLEL and take the first usable response
  // instead of walking them one-by-one (5 × 3.5s = up to 17.5s of dead waiting).
  // The last instance that worked is tried first next time.
  getInstanceOrder() {
    const preferred = localStorage.getItem('yt_working_instance');
    return [...INVIDIOUS_INSTANCES].sort(
      (a, b) => (a === preferred ? -1 : 0) - (b === preferred ? -1 : 0)
    );
  },

  rememberInstance(instance) {
    try { localStorage.setItem('yt_working_instance', instance); } catch (e) {}
  },

  async raceInstances(path) {
    const controllers = [];
    const attempts = this.getInstanceOrder().map((instance) => {
      const controller = new AbortController();
      controllers.push(controller);
      return (async () => {
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
          const res = await fetch(`${instance}${path}`, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          // First winner: cancel the rest so we don't keep draining bandwidth.
          controllers.forEach((c) => { if (c !== controller) c.abort(); });
          this.rememberInstance(instance);
          return data;
        } finally {
          clearTimeout(timeout);
        }
      })();
    });
    try {
      return await Promise.any(attempts);
    } catch (e) {
      return null; // every instance failed
    }
  },

  async fetchLiveChannelData(channelId) {
    const videos = await this.raceInstances(`/api/v1/channels/${channelId}/videos`);
    if (!Array.isArray(videos) || videos.length === 0) return;

    const formatted = videos.slice(0, 20).map(v => ({
      id: v.videoId,
      title: v.title,
      duration: formatSeconds(v.lengthSeconds || 420),
      views: `${formatNumber(v.viewCount || 1500)} views`,
      publishedText: v.publishedText || 'Recently',
      thumbnail: v.videoThumbnails ? v.videoThumbnails[0].url : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      channelId: channelId,
      channelName: v.author || 'YouTube Channel',
      description: v.description || ''
    }));

    if (!this.dataCache[channelId]) this.dataCache[channelId] = { videos: [], playlists: [] };
    // Merge rather than replace: overwriting the curated video list here used to
    // silently break every playlist for this channel (playlist detail pages look
    // up each video id in dataCache[channelId].videos, and a wiped/replaced list
    // means those lookups fail). Public Invidious instances also come and go, so a
    // hard overwrite made the catalog's contents change unpredictably between
    // sessions. Instead, keep the curated catalog intact and just add any
    // freshly-fetched videos that aren't already in it.
    const existing = this.dataCache[channelId].videos || [];
    const existingIds = new Set(existing.map(v => v.id));
    const freshOnly = formatted.filter(v => !existingIds.has(v.id));
    if (freshOnly.length > 0) {
      this.dataCache[channelId].videos = [...freshOnly, ...existing];
      this.saveCatalog();
      // Never yank the UI out from under a user who is watching a video or
      // browsing a playlist — the refreshed data is already in the cache and
      // will show on the next navigation.
      if (!this.watchVideo && this.activeView !== 'playlist_detail' &&
          (this.activeView === 'home' || (this.activeView === 'channel' && this.selectedChannelId === channelId))) {
        this.renderBody();
      }
    }
  },

  async fetchIsolatedVideoMeta(id) {
    const data = await this.raceInstances(`/api/v1/videos/${id}?fields=title,lengthSeconds,description`);
    if (data) {
      this.isolatedVideoData = {
        id,
        title: data.title || 'Untitled Video',
        duration: formatSeconds(data.lengthSeconds || 0),
        description: data.description || 'No description available.'
      };
    } else {
      // Every Invidious instance failed — still let the video play, just without metadata.
      this.isolatedVideoData = {
        id,
        title: 'Video ' + id,
        duration: '--:--',
        description: 'Could not fetch metadata right now (all sources unreachable). The player above may still work.'
      };
    }
    if (this.isolatedVideoId === id) this.renderIsolatedPage();
  },

  async checkEmbeddable(id, fallbackElId) {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`);
      if (!res.ok) {
        const el = document.getElementById(fallbackElId);
        if (el) el.classList.remove('hidden');
      }
    } catch (e) {
      // Can't reach oEmbed (offline/CORS) — stay silent, the iframe itself is still the primary signal.
    }
  },
};