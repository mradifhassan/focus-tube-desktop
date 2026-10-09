/**
 * @file views/watch.js
 * Watch page — iframe player, title/channel/description, either a
 * native-style playlist queue (when watching inside a playlist) or
 * channel-only "More videos" recommendations, plus their event wiring.
 */

import { ICONS } from '../icons.js';

export const watchViewMixin = {
  renderWatchVideoPageHtml() {
    const vid = this.watchVideo;
    const ch = this.subscribedChannels.find(c => c.id === vid.channelId) || { name: vid.channelName || 'YouTube Channel', initials: 'YT', avatarColor: 'bg-red-600' };

    // "More videos" is scoped to ONLY this channel's own catalog — never pulls in outside/YouTube
    // suggestions, so watching stays isolated to the channels the user actually follows here.
    const allVids = this.getAllCachedVideos();
    const channelVids = allVids.filter(v => v.channelId === vid.channelId);
    const engine = this.getRelatedEngine(vid.channelId, channelVids);
    let upNext = engine.getUpNext(vid.id, 12).filter(v => v.id !== vid.id);
    if (upNext.length < 4) {
      upNext = channelVids.filter(v => v.id !== vid.id).slice(0, 12);
    }

    // Native-YouTube-style playlist queue: active only when the current video belongs to
    // the selected playlist (e.g. opened via "Play All" or a #/channel/.../playlist/.../video/N link).
    const inPlaylist = !!(this.selectedPlaylist && Array.isArray(this.selectedPlaylist.videos) && this.selectedPlaylist.videos.includes(vid.id));
    const plIds = inPlaylist ? this.selectedPlaylist.videos : [];
    const plIdx = inPlaylist ? plIds.indexOf(vid.id) : -1;

    return `
      <!-- TOP BACK BUTTON RAIL -->
      <div class="sticky top-0 z-30 bg-[#0f0f0f] px-3 sm:px-6 py-3 border-b border-[#272727] flex flex-wrap items-center justify-between gap-2">
        <button id="watch-back-btn" class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] text-white font-bold text-xs sm:text-sm rounded-full transition shadow">
          <span>&larr;</span>
          <span>Back (${this.watchHistoryStack.length > 0 ? 'Previous Video' : 'Home'})</span>
        </button>

        <span class="text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full bg-[#272727] text-[#aaa]">
          ${this.privacyShield ? 'Privacy Shield Enabled' : 'Standard YouTube'}
        </span>
      </div>

      <div class="p-3 sm:p-4 lg:p-8 max-w-[1700px] mx-auto flex flex-col lg:flex-row gap-4 sm:gap-8">
        
        <!-- LEFT MAIN WATCH CONTAINER -->
        <div class="flex-1 flex flex-col gap-4 max-w-5xl min-w-0">
          
          <!-- LIGHTWEIGHT FACADE: static thumbnail + play overlay. The real
               YouTube embed is only hydrated on click (facade pattern), so
               opening a watch page pulls zero YouTube scripts/streams until the
               user actually wants to play. Hover/touch pre-warms the connection. -->
          <div id="watch-player-shell" class="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#272727]">
            <div id="watch-player-facade" data-facade-vid="${vid.id}" class="absolute inset-0 cursor-pointer group" role="button" aria-label="Play ${vid.title}">
              <img src="https://i.ytimg.com/vi/${vid.id}/maxresdefault.jpg" alt="${vid.title}" decoding="async" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg'" />
              <div class="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition flex items-center justify-center">
                <span class="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-105 transition">
                  <svg class="w-9 h-9 ml-1 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </span>
              </div>
            </div>
          </div>

          <!-- EMBEDDING-DISABLED FALLBACK (shown only if this video can't be embedded) -->
          <div id="watch-embed-fallback" class="hidden bg-[#1f1f1f] border border-[#3f3f3f] rounded-xl p-4 text-sm text-[#ddd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>This video's owner has disabled embedding, so it can't play here.</span>
            <a href="https://www.youtube.com/watch?v=${vid.id}" target="_blank" rel="noopener" class="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white font-bold text-xs">Watch on YouTube</a>
          </div>

          <!-- VIDEO TITLE + ISOLATED MODE LINK -->
          <div class="flex items-start justify-between gap-4">
            <h1 class="text-lg sm:text-xl font-bold text-white leading-snug">${vid.title}</h1>
            <a href="${window.location.pathname}#/v/${vid.id}" target="_blank" rel="noopener" class="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-[#aaa] hover:text-white transition whitespace-nowrap" title="Open this video alone, with no recommendations or feed">
              Open Isolated
            </a>
          </div>

          <!-- CHANNEL INFO & ACTIONS ROW -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#272727]">
            
            <div class="flex items-center gap-4">
              <div data-goto-ch="${ch.id || vid.channelId}" class="w-11 h-11 rounded-full ${ch.avatarColor || 'bg-red-600'} text-white font-bold text-sm flex items-center justify-center cursor-pointer shrink-0 shadow">
                ${ch.initials || 'YT'}
              </div>
              <div class="flex flex-col">
                <h3 data-goto-ch="${ch.id || vid.channelId}" class="text-base font-bold text-white hover:text-[#3ea6ff] cursor-pointer">${ch.name}</h3>
                <span class="text-xs text-[#aaa]">Official Channel</span>
              </div>
              <button class="ml-2 bg-[#f1f1f1] hover:bg-white text-black font-bold text-xs px-4 py-2 rounded-full shadow">
                Subscribed
              </button>
            </div>

            <div class="flex items-center gap-2">
              <div class="flex items-center bg-[#272727] rounded-full overflow-hidden">
                <button class="px-4 py-2 text-xs font-medium hover:bg-[#3f3f3f] flex items-center gap-1.5 border-r border-[#3f3f3f]">
                  &#128077; Like
                </button>
                <button class="px-3 py-2 text-xs font-medium hover:bg-[#3f3f3f]">&#128078;</button>
              </div>
              
              <button class="px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full text-xs font-medium flex items-center gap-1.5">
                Share
              </button>
            </div>

          </div>

          <!-- DESCRIPTION BOX -->
          <div class="bg-[#1f1f1f] hover:bg-[#272727]/80 rounded-2xl p-4 transition cursor-pointer flex flex-col gap-2" id="toggle-desc-box">
            <div class="flex items-center gap-3 text-xs font-bold text-white">
              <span>${vid.views || '1,240 views'}</span>
              <span>${vid.publishedText || 'Recently'}</span>
            </div>
            <p class="text-xs text-[#ddd] ${this.descriptionExpanded ? '' : 'line-clamp-2'} whitespace-pre-line leading-relaxed">${vid.description || 'Watch full video stream on FreeTube interface.'}</p>
            <span class="text-xs font-bold text-[#aaa] mt-1">${this.descriptionExpanded ? 'Show less' : '...more'}</span>
          </div>

        </div>

        <!-- RIGHT SIDEBAR: NATIVE-STYLE PLAYLIST QUEUE (when watching from a playlist) OR CHANNEL-ONLY "MORE VIDEOS" -->
        <div class="w-full lg:w-96 flex flex-col gap-4 shrink-0">
          ${inPlaylist ? `
            <div class="bg-[#1f1f1f] rounded-2xl border border-[#272727] overflow-hidden flex flex-col">
              <div class="p-4 flex flex-col gap-2 border-b border-[#272727] bg-gradient-to-b from-[#2a2a2a] to-[#1f1f1f]">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-bold text-white leading-snug">${this.selectedPlaylist.title}</h3>
                  <button id="playlist-panel-close" class="text-[#aaa] hover:text-white shrink-0" title="Exit playlist">${ICONS.close}</button>
                </div>
                <div class="flex items-center gap-2 text-xs text-[#aaa]">
                  <span class="truncate">${this.selectedPlaylist.channelName || ch.name}</span>
                  <span>&bull;</span>
                  <span class="shrink-0">${plIdx + 1} / ${plIds.length}</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <button id="playlist-repeat-btn" title="Repeat playlist" class="p-2 rounded-full transition ${this.playlistRepeat ? 'bg-[#3ea6ff] text-black' : 'bg-[#272727] hover:bg-[#3f3f3f] text-[#aaa]'}">&#128257;</button>
                  <button id="playlist-shuffle-btn" title="Shuffle" class="p-2 rounded-full transition ${this.playlistShuffle ? 'bg-[#3ea6ff] text-black' : 'bg-[#272727] hover:bg-[#3f3f3f] text-[#aaa]'}">&#128256;</button>
                  <button id="playlist-autoplay-toggle" title="Toggle autoplay" class="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition ${this.playlistAutoplay ? 'bg-[#272727] text-white' : 'bg-[#272727] text-[#777]'}">
                    <span>Autoplay</span>
                    <span class="w-8 h-4 rounded-full relative transition ${this.playlistAutoplay ? 'bg-[#3ea6ff]' : 'bg-[#555]'}">
                      <span class="absolute top-0.5 ${this.playlistAutoplay ? 'left-4' : 'left-0.5'} w-3 h-3 rounded-full bg-white transition-all"></span>
                    </span>
                  </button>
                </div>
              </div>
              <div class="max-h-[70vh] lg:max-h-[600px] overflow-y-auto flex flex-col">
                ${plIds.map((id, i) => {
                  const v = allVids.find(x => x.id === id) || { id, title: 'YouTube Broadcast (' + id + ')', thumbnail: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', channelName: this.selectedPlaylist.channelName, channelId: vid.channelId };
                  const active = id === vid.id;
                  return `
                    <div data-related-vid="${id}" data-ch="${v.channelId || vid.channelId}" data-in-playlist="true" class="flex gap-3 p-2.5 items-center cursor-pointer group ${active ? 'bg-[#3f3f3f]' : 'hover:bg-[#272727]'}">
                      <span class="w-5 text-center text-xs font-mono shrink-0 ${active ? 'text-[#3ea6ff]' : 'text-[#888]'}">${active ? '&#9654;' : i + 1}</span>
                      <div class="relative w-28 aspect-video rounded-lg overflow-hidden bg-[#222] shrink-0">
                        <img src="${v.thumbnail || ''}" alt="${v.title}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition" />
                        <span class="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-white text-[9px] font-mono">${v.duration || ''}</span>
                      </div>
                      <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                        <h4 class="text-xs font-medium line-clamp-2 leading-snug ${active ? 'text-[#3ea6ff]' : 'text-white'}">${v.title}</h4>
                        <p class="text-[10px] text-[#888] truncate">${v.channelName || ''}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : `
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-white">
                More from ${ch.name}
              </h3>
            </div>

            <div class="flex flex-col gap-3">
              ${upNext.map(v => `
                <div data-related-vid="${v.id}" data-ch="${v.channelId}" class="flex gap-3 p-2 rounded-xl hover:bg-[#272727] transition cursor-pointer group">
                  <div class="relative w-40 aspect-video rounded-lg overflow-hidden bg-[#222] shrink-0">
                    <img src="${v.thumbnail}" alt="${v.title}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition" />
                    <span class="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-white text-[10px] font-mono">${v.duration}</span>
                  </div>
                  <div class="flex flex-col gap-1 flex-1 overflow-hidden">
                    <h4 class="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3ea6ff]">${v.title}</h4>
                    <p class="text-[11px] text-[#aaa] truncate">${v.channelName}</p>
                    <p class="text-[10px] text-[#888]">${v.views}</p>
                  </div>
                </div>
              `).join('')}
              ${upNext.length === 0 ? `<p class="text-xs text-[#888] px-2">No other videos from this channel yet.</p>` : ''}
            </div>
          `}
        </div>

      </div>
    `;
  },

  // Before the watch page is re-rendered, keep a reference to the live <iframe>
  // so the innerHTML swap never tears down the playing YouTube player. If the new
  // page is a watch page, restorePlayerShell() re-parents the same element (and
  // only swaps its src when the video actually changed) — this is what makes
  // description/repeat/shuffle/autoplay toggles and related-video switches smooth
  // instead of reloading the player from scratch.
  capturePlayerShell() {
    this._pendingPlayerFrame = null;
    this._pendingPlayerVideoId = null;
    if (!this.watchVideo) return;
    const main = document.getElementById('yt-body-content');
    if (!main) return;
    const frame = main.querySelector('#yt-watch-iframe');
    if (frame) {
      this._pendingPlayerFrame = frame;
      this._pendingPlayerVideoId = this.watchVideo.id;
    }
  },

  restorePlayerShell() {
    if (!this._pendingPlayerFrame) return;
    const main = document.getElementById('yt-body-content');
    if (!main) return;
    const shell = main.querySelector('#watch-player-shell');
    if (!shell) return;

    const id = this.watchVideo ? this.watchVideo.id : null;
    const changed = !!id && id !== this._pendingPlayerVideoId;

    // Re-parent the live iframe in place of the freshly-inserted one.
    shell.replaceChildren(this._pendingPlayerFrame);

    if (changed) {
      const host = this.privacyShield ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
      const origin = encodeURIComponent(window.location.origin);
      this._pendingPlayerFrame.src = `${host}/embed/${id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`;
      this._pendingPlayerFrame.title = (this.watchVideo && this.watchVideo.title) || '';
    }

    this._pendingPlayerFrame = null;
    this._pendingPlayerVideoId = null;
  },

  // The app scrolls inside <main id="yt-body-content"> (overflow-y-auto), so
  // window.scrollTo() never moves it. Target the real container instead.
  scrollMainToTop(instant = true) {
    const main = document.getElementById('yt-body-content');
    if (main) {
      if (instant) main.scrollTop = 0;
      else main.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    }
  },

  attachWatchPageListeners() {
    if (this.watchVideo) {
      if (!this._checkedEmbeddable) this._checkedEmbeddable = new Set();
      const embedId = this.watchVideo.id;
      if (!this._checkedEmbeddable.has(embedId)) {
        this._checkedEmbeddable.add(embedId);
        this.checkEmbeddable(embedId, 'watch-embed-fallback');
      }
    }

    // Facade player: pre-warm on hover/touch, then hydrate the real embed on click.
    this.wireFacadeEvents('watch-player-facade', this.hydrateWatchFacade);

    const backBtn = document.getElementById('watch-back-btn');
    if (backBtn) {
      backBtn.onclick = () => {
        if (this.watchHistoryStack.length > 0) {
          const prev = this.watchHistoryStack.pop();
          this.watchVideo = prev;
          this.renderBody();
        } else {
          this.watchVideo = null;
          this.renderBody();
        }
        this.syncHash();
      };
    }

    // Expand/collapse the description in place. Never re-render: a re-render would
    // rebuild the iframe and restart the video that is currently playing.
    const descBox = document.getElementById('toggle-desc-box');
    if (descBox) {
      descBox.onclick = () => {
        this.descriptionExpanded = !this.descriptionExpanded;
        const p = descBox.querySelector('p');
        const label = descBox.querySelector('span:last-child');
        if (p) p.classList.toggle('line-clamp-2', !this.descriptionExpanded);
        if (label) label.textContent = this.descriptionExpanded ? 'Show less' : '...more';
      };
    }

    document.querySelectorAll('[data-related-vid]').forEach(el => {
      el.onclick = () => {
        const vidId = el.getAttribute('data-related-vid');
        const all = this.getAllCachedVideos();
        const found = all.find(v => v.id === vidId) || { id: vidId, title: "YouTube Stream", channelId: el.getAttribute('data-ch') };

        // Clicks from the playlist queue panel keep the playlist context (so autoplay keeps working);
        // clicks from the plain "More from this channel" list are standalone.
        if (!el.hasAttribute('data-in-playlist')) {
          this.selectedPlaylist = null;
        }

        if (this.watchVideo) {
          this.watchHistoryStack.push(this.watchVideo);
        }
        this.watchVideo = found;
        this.scrollMainToTop();
        this.renderBody();
        this.syncHash();
      };
    });

    // Playlist queue panel controls (repeat / shuffle / autoplay toggle / exit playlist)
    const repeatBtn = document.getElementById('playlist-repeat-btn');
    if (repeatBtn) {
      repeatBtn.onclick = () => {
        this.playlistRepeat = !this.playlistRepeat;
        this.renderBody();
      };
    }
    const shuffleBtn = document.getElementById('playlist-shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.onclick = () => {
        this.playlistShuffle = !this.playlistShuffle;
        this.renderBody();
      };
    }
    const autoplayToggle = document.getElementById('playlist-autoplay-toggle');
    if (autoplayToggle) {
      autoplayToggle.onclick = () => {
        this.playlistAutoplay = !this.playlistAutoplay;
        this.renderBody();
      };
    }
    const panelClose = document.getElementById('playlist-panel-close');
    if (panelClose) {
      panelClose.onclick = () => {
        this.selectedPlaylist = null;
        this.renderBody();
        this.syncHash();
      };
    }

    // Wire up the YouTube IFrame JS API so that, when watching from a playlist, the next
    // queued video auto-plays the moment the current one ends — no manual "exit & reopen" needed.
    const inPlaylist = !!(this.selectedPlaylist && Array.isArray(this.selectedPlaylist.videos) && this.watchVideo && this.selectedPlaylist.videos.includes(this.watchVideo.id));
    if (inPlaylist) {
      this.initPlaylistPlayer();
    } else {
      this._ytPlayer = null;
    }
  },
};