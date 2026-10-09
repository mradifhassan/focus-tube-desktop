/**
 * @file player.js
 * YouTube IFrame API integration for native-style playlist autoplay,
 * repeat and shuffle while watching inside a playlist queue.
 */

export const playerMixin = {
  loadYouTubeIframeAPI() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (this._ytApiPromise) return this._ytApiPromise;
    this._ytApiPromise = new Promise((resolve) => {
      const prevCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCb === 'function') prevCb();
        resolve();
      };
      if (!document.querySelector('script[data-yt-iframe-api]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.setAttribute('data-yt-iframe-api', 'true');
        document.head.appendChild(tag);
      }
    });
    return this._ytApiPromise;
  },

  async initPlaylistPlayer() {
    const watchingId = this.watchVideo ? this.watchVideo.id : null;
    await this.loadYouTubeIframeAPI();
    // Bail out if the user navigated away while the API script was loading.
    if (!this.watchVideo || this.watchVideo.id !== watchingId) return;
    const el = document.getElementById('yt-watch-iframe');
    if (!el) return;

    if (this._ytPlayer) {
      try { this._ytPlayer.destroy(); } catch (e) {}
      this._ytPlayer = null;
    }

    try {
      this._ytPlayer = new YT.Player('yt-watch-iframe', {
        events: {
          onStateChange: (ev) => {
            if (ev.data === YT.PlayerState.ENDED) {
              this.playNextInPlaylist();
            }
          }
        }
      });
    } catch (e) {
      this._ytPlayer = null;
    }
  },

  playNextInPlaylist() {
    if (!this.playlistAutoplay || !this.selectedPlaylist || !Array.isArray(this.selectedPlaylist.videos) || !this.watchVideo) return;
    const ids = this.selectedPlaylist.videos;
    const idx = ids.indexOf(this.watchVideo.id);
    if (idx === -1) return;

    let nextIdx;
    if (this.playlistShuffle) {
      if (ids.length <= 1) return;
      do { nextIdx = Math.floor(Math.random() * ids.length); } while (nextIdx === idx);
    } else {
      nextIdx = idx + 1;
      if (nextIdx >= ids.length) {
        if (!this.playlistRepeat) return;
        nextIdx = 0;
      }
    }

    const nextId = ids[nextIdx];
    const allVids = this.getAllCachedVideos();
    this.watchVideo = allVids.find(v => v.id === nextId) || { id: nextId, title: 'Video', channelId: this.selectedPlaylist.channelId, channelName: this.selectedPlaylist.channelName };
    this.scrollMainToTop();
    this.renderBody();
    this.syncHash();
  },

  // ============================================================================
  // FACADE PLAYER (lazy YouTube hydration)
  // ============================================================================
  // Instead of embedding the YouTube iframe the moment a watch page renders
  // (which downloads YouTube's player scripts + streams before you can even
  // click play, freezing the page for seconds on slow links), we render a
  // lightweight thumbnail + play-button facade and only inject the real embed
  // after an explicit click. Hovering/touching the facade pre-warms the
  // connection and prefetches the IFrame API script, so hydration is near-instant.

  preconnectUrl(href) {
    const url = new URL(href).href;
    if (!this._preconnects) {
      this._preconnects = new Set(
        Array.from(document.querySelectorAll('link[rel="preconnect"]'), (l) => l.href)
      );
    }
    if (this._preconnects.has(url)) return;
    this._preconnects.add(url);
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    document.head.appendChild(link);
  },

  prewarmYtFacade() {
    if (this._ytPrewarmed) return;
    this._ytPrewarmed = true;
    this.preconnectUrl('https://www.youtube.com');
    this.preconnectUrl('https://www.google.com');
    this.preconnectUrl('https://i.ytimg.com');
    const pre = document.createElement('link');
    pre.rel = 'prefetch';
    pre.as = 'script';
    pre.href = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(pre);
  },

  buildPlayerIframe(id, title) {
    const host = this.privacyShield ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
    const origin = encodeURIComponent(window.location.origin);
    const iframe = document.createElement('iframe');
    iframe.id = 'yt-watch-iframe';
    iframe.src = `${host}/embed/${id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`;
    iframe.title = title || '';
    iframe.className = 'w-full h-full border-0';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    return iframe;
  },

  hydrateWatchFacade(facade) {
    const id = facade.getAttribute('data-facade-vid');
    const shell = document.getElementById('watch-player-shell');
    if (!id || !shell) return;
    shell.replaceChildren(this.buildPlayerIframe(id, (this.watchVideo && this.watchVideo.title) || ''));
    // In a playlist, bind the IFrame API so the queue auto-advances on ENDED.
    if (this.selectedPlaylist && Array.isArray(this.selectedPlaylist.videos) && this.selectedPlaylist.videos.includes(id)) {
      this.initPlaylistPlayer();
    }
  },

  hydrateIsolatedFacade(facade) {
    const id = facade.getAttribute('data-facade-vid');
    const shell = document.getElementById('isolated-player-shell');
    if (!id || !shell) return;
    shell.replaceChildren(this.buildPlayerIframe(id, (this.isolatedVideoData && this.isolatedVideoData.title) || 'Video player'));
  },

  wireFacadeEvents(facadeId, hydrateFn) {
    const facade = document.getElementById(facadeId);
    if (!facade) return;
    facade.addEventListener('mouseenter', () => this.prewarmYtFacade());
    facade.addEventListener('touchstart', () => this.prewarmYtFacade(), { passive: true });
    facade.addEventListener('click', () => hydrateFn.call(this, facade));
  },
};