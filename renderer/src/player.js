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
};