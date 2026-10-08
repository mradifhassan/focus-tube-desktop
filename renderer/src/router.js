/**
 * @file router.js
 * Hash-based routing for shareable deep links:
 *   #/                                   -> home
 *   #/v/VIDEO_ID                         -> isolated single-video view
 *   #/channel/SLUG                       -> channel page
 *   #/channel/SLUG/playlist/ID           -> playlist detail
 *   #/channel/SLUG/playlist/ID/video/N   -> playlist video (1-indexed)
 *   #/channel/SLUG/video/VIDEO_ID        -> channel video
 *   #/library                            -> library/playlists
 *   #/subscriptions                      -> subscriptions feed
 */

export const routerMixin = {
  slugify(str) {
    const s = String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    return s || 'channel';
  },

  resolveChannel(key) {
    if (!key) return null;
    const decoded = decodeURIComponent(key);
    let ch = this.subscribedChannels.find(c => c.id === decoded);
    if (ch) return ch;
    const slug = decoded.toLowerCase();
    return this.subscribedChannels.find(c => this.slugify(c.name) === slug) || null;
  },

  parseRoute() {
    const h = window.location.hash;

    let m = h.match(/^#\/v\/([a-zA-Z0-9_-]{6,20})$/);
    if (m) return { type: 'isolated', videoId: m[1] };

    m = h.match(/^#\/channel\/([^/]+)\/playlist\/([^/]+)\/video\/(\d+)$/);
    if (m) return { type: 'playlist_video', channelKey: m[1], playlistId: m[2], index: parseInt(m[3], 10) };

    m = h.match(/^#\/channel\/([^/]+)\/playlist\/([^/]+)$/);
    if (m) return { type: 'playlist', channelKey: m[1], playlistId: m[2] };

    m = h.match(/^#\/channel\/([^/]+)\/video\/([^/]+)$/);
    if (m) return { type: 'channel_video', channelKey: m[1], videoId: m[2] };

    m = h.match(/^#\/channel\/([^/]+)$/);
    if (m) return { type: 'channel', channelKey: m[1] };

    if (h === '#/library') return { type: 'library' };
    if (h === '#/subscriptions') return { type: 'subscriptions' };

    return { type: 'home' };
  },

  // Applies a parsed route to app state. Does NOT touch the address bar (see syncHash()).
  applyRoute(route, opts) {
    opts = opts || {};

    if (route.type === 'isolated') {
      this.isolatedVideoId = route.videoId;
      this.isolatedVideoData = null;
      return;
    }
    this.isolatedVideoId = null;
    this.isolatedVideoData = null;

    if (route.type === 'home') {
      this.watchVideo = null;
      this.activeView = 'home';
      this.selectedChannelId = null;
      this.selectedPlaylist = null;
      return;
    }
    if (route.type === 'library') {
      this.watchVideo = null;
      this.activeView = 'library';
      this.selectedChannelId = null;
      this.selectedPlaylist = null;
      return;
    }
    if (route.type === 'subscriptions') {
      this.watchVideo = null;
      this.activeView = 'subscriptions';
      this.selectedChannelId = null;
      this.selectedPlaylist = null;
      return;
    }

    // On the very first load, catalogs are populated synchronously from local cache/builtin data,
    // so channel/playlist/video routes can resolve immediately even before live fetches complete.
    const ch = this.resolveChannel(route.channelKey);
    if (!ch) {
      this.activeView = 'home';
      return;
    }
    this.selectedChannelId = ch.id;

    if (route.type === 'channel') {
      this.watchVideo = null;
      this.activeView = 'channel';
      this.selectedPlaylist = null;
      this.channelTab = 'videos';
      return;
    }

    if (route.type === 'playlist' || route.type === 'playlist_video') {
      const pls = this.getAllCachedPlaylists();
      const decodedPlId = decodeURIComponent(route.playlistId);
      const pl = pls.find(p => p.id === decodedPlId && p.channelId === ch.id) || pls.find(p => p.id === decodedPlId);
      if (!pl) {
        this.watchVideo = null;
        this.activeView = 'channel';
        return;
      }
      this.selectedPlaylist = pl;
      if (route.type === 'playlist') {
        this.watchVideo = null;
        this.activeView = 'playlist_detail';
      } else {
        const vidId = pl.videos && pl.videos[route.index - 1];
        if (vidId) {
          const allVids = this.getAllCachedVideos();
          this.watchVideo = allVids.find(v => v.id === vidId) || { id: vidId, title: 'Video', channelId: ch.id, channelName: ch.name };
        }
      }
      return;
    }

    if (route.type === 'channel_video') {
      const allVids = this.getAllCachedVideos();
      const vidId = decodeURIComponent(route.videoId);
      this.watchVideo = allVids.find(v => v.id === vidId) || { id: vidId, title: 'Video', channelId: ch.id, channelName: ch.name };
      this.selectedPlaylist = null;
      return;
    }
  },

  // Builds a canonical shareable hash for the current app state and writes it to the
  // address bar via pushState (no hashchange fires, so this never causes a re-render loop).
  buildRouteHash() {
    if (this.isolatedVideoId) return `#/v/${this.isolatedVideoId}`;

    if (this.watchVideo) {
      const ch = this.subscribedChannels.find(c => c.id === this.watchVideo.channelId);
      const chKey = encodeURIComponent(ch ? this.slugify(ch.name) : (this.watchVideo.channelId || 'channel'));
      if (this.selectedPlaylist && Array.isArray(this.selectedPlaylist.videos)) {
        const idx = this.selectedPlaylist.videos.indexOf(this.watchVideo.id);
        if (idx >= 0) {
          return `#/channel/${chKey}/playlist/${encodeURIComponent(this.selectedPlaylist.id)}/video/${idx + 1}`;
        }
      }
      return `#/channel/${chKey}/video/${encodeURIComponent(this.watchVideo.id)}`;
    }

    if (this.activeView === 'playlist_detail' && this.selectedPlaylist) {
      const owner = this.subscribedChannels.find(c => c.id === this.selectedPlaylist.channelId);
      const chKey = encodeURIComponent(owner ? this.slugify(owner.name) : (this.selectedPlaylist.channelId || 'channel'));
      return `#/channel/${chKey}/playlist/${encodeURIComponent(this.selectedPlaylist.id)}`;
    }

    if (this.activeView === 'channel' && this.selectedChannelId) {
      const ch = this.subscribedChannels.find(c => c.id === this.selectedChannelId);
      const chKey = encodeURIComponent(ch ? this.slugify(ch.name) : this.selectedChannelId);
      return `#/channel/${chKey}`;
    }

    if (this.activeView === 'library') return '#/library';
    if (this.activeView === 'subscriptions') return '#/subscriptions';

    return '#/';
  },

  syncHash() {
    const hash = this.buildRouteHash();
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  },
};