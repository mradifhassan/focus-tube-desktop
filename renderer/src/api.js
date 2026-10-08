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
  async fetchLiveChannelData(channelId) {
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(`${instance}/api/v1/channels/${channelId}/videos`, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const videos = await res.json();
          if (Array.isArray(videos) && videos.length > 0) {
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
              if (this.activeView === 'home' || (this.activeView === 'channel' && this.selectedChannelId === channelId)) {
                this.renderBody();
              }
            }
            return;
          }
        }
      } catch (e) {}
    }
  },

  async fetchIsolatedVideoMeta(id) {
    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(`${instance}/api/v1/videos/${id}?fields=title,lengthSeconds,description`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          this.isolatedVideoData = {
            id,
            title: data.title || 'Untitled Video',
            duration: formatSeconds(data.lengthSeconds || 0),
            description: data.description || 'No description available.'
          };
          if (this.isolatedVideoId === id) this.renderIsolatedPage();
          return;
        }
      } catch (e) {}
    }
    // Every Invidious instance failed — still let the video play, just without metadata.
    this.isolatedVideoData = {
      id,
      title: 'Video ' + id,
      duration: '--:--',
      description: 'Could not fetch metadata right now (all sources unreachable). The player above may still work.'
    };
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