/**
 * @file seo.js
 * Per-view <title>/<meta description>/<link rel=canonical> updates so each
 * deep link (home, channel, playlist, video) has a unique searchable title.
 * Google/Bing/DuckDuckGo see dynamic titles even on a hash-routed SPA because
 * the DOM <head> is updated while the page stays the same URL.
 */

const SITE_TITLE = 'FocusTube - Distraction-Free YouTube for HSC Learning';
const SITE_URL = 'https://mradifhassan.github.io/focus-tube/';

export const seoMixin = {
  setDocumentMeta(title, description) {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
  },

  updateSeoMeta() {
    // Isolated single-video route (#/v/ID) — data may still be loading.
    if (this.isolatedVideoId) {
      const v = this.isolatedVideoData || {};
      const t = v.title ? `${v.title} - FocusTube` : `Video ${this.isolatedVideoId} - FocusTube`;
      this.setDocumentMeta(t, v.title ? `Watch "${v.title}" distraction-free on FocusTube — no ads, no recommendations.` : 'Isolated distraction-free video player on FocusTube.');
      return;
    }

    // A video is open either directly (#/channel/.../video/ID) or via playlist.
    if (this.watchVideo) {
      const ch = this.subscribedChannels.find(c => c.id === this.watchVideo.channelId);
      const chName = ch ? ch.name : (this.watchVideo.channelName || '');
      const t = `${this.watchVideo.title || 'Video'} - FocusTube`;
      const d = `Watch "${this.watchVideo.title || ''}" on FocusTube${chName ? ` by ${chName}` : ''} — distraction-free, ad-free learning.`;
      this.setDocumentMeta(t, d);
      return;
    }

    if (this.activeView === 'channel' && this.selectedChannelId) {
      const ch = this.subscribedChannels.find(c => c.id === this.selectedChannelId);
      const chName = ch ? ch.name : '';
      this.setDocumentMeta(`${chName} - FocusTube`, `Browse curated educational videos and playlists from ${chName} — ad-free and distraction-free on FocusTube.`);
      return;
    }

    if (this.activeView === 'playlist_detail' && this.selectedPlaylist) {
      const pl = this.selectedPlaylist;
      const ch = this.subscribedChannels.find(c => c.id === pl.channelId);
      const chName = ch ? ch.name : (pl.channelName || '');
      this.setDocumentMeta(`${pl.title} - FocusTube`, `Playlist "${pl.title}"${chName ? ` by ${chName}` : ''} on FocusTube — watch {count} curated HSC educational videos without distractions.`.replace('{count}', (pl.videos && pl.videos.length) || ''));
      return;
    }

    if (this.activeView === 'library') {
      this.setDocumentMeta('Your Playlists - FocusTube', 'All your saved HSC educational playlists on FocusTube, the distraction-free YouTube client.');
      return;
    }

    if (this.activeView === 'subscriptions') {
      this.setDocumentMeta('Subscriptions - FocusTube', 'Feed of your subscribed educational channels on FocusTube, the distraction-free YouTube client.');
      return;
    }

    if (this.activeView === 'search') {
      const q = this.searchQuery || 'search';
      this.setDocumentMeta(`Search "${q}" - FocusTube`, `Search results for "${q}" on FocusTube — curated HSC educational videos without distractions.`);
      return;
    }

    this.setDocumentMeta(SITE_TITLE, 'FocusTube is a free, distraction-free YouTube client built for HSC students in Bangladesh. Browse curated educational videos from OnnoRokom Pathshala, Alchemy, and AloronXYZ — no ads, no recommendations, just focused learning.');
  },
};