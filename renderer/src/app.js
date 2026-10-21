/**
 * @file app.js
 * FreeTubeApp — the application shell & state. All page rendering and
 * feature logic lives in feature modules mixed into the class prototype:
 *   - views/     page rendering (home, search, channel, library, playlist, watch, isolated)
 *   - router.js  shareable hash routing
 *   - api.js     Invidious / oEmbed fetches
 *   - storage.js localStorage persistence
 *   - player.js  YouTube IFrame API / playlist autoplay
 *   - events.js  global click/key/submit listeners
 */

import { ICONS } from './icons.js';
import { RelatedVideosEngine } from './engine.js';
import { routerMixin } from './router.js';
import { seoMixin } from './seo.js';
import { apiMixin } from './api.js';
import { storageMixin } from './storage.js';
import { playerMixin } from './player.js';
import { eventsMixin } from './events.js';
import { viewsMixin } from './views/index.js';
import { formatSeconds, formatNumber, escapeHtml } from './utils.js';

class FreeTubeApp {
  constructor() {
    this.subscribedChannels = this.loadChannels();
    this.userName = localStorage.getItem('yt_user_name') || 'Radif Hassan';
    this.privacyShield = localStorage.getItem('yt_privacy_shield') !== 'false';

    // View State
    this.activeView = 'home'; // 'home' | 'channel' | 'subscriptions' | 'library' | 'playlist_detail'
    this.selectedChannelId = null;
    this.selectedPlaylist = null;
    this.channelTab = 'videos'; // 'videos' | 'playlists' | 'about'
    this.searchQuery = '';
    this.feedFilter = 'all'; // 'all' | 'playlists' | 'science' | 'tech'
    // Sidebar is a persistent mini/full rail on large screens, a slide-over drawer on small ones.
    this.sidebarExpanded = window.innerWidth >= 1024;
    this.isMobile = window.innerWidth < 1024;
    window.addEventListener('resize', () => {
      const nowMobile = window.innerWidth < 1024;
      if (nowMobile !== this.isMobile) {
        this.isMobile = nowMobile;
        this.sidebarExpanded = !nowMobile;
        this.render();
      }
    });

    // Player Stack
    this.watchVideo = null;
    this.watchHistoryStack = [];
    this.descriptionExpanded = false;

    // Native-style playlist autoplay/queue state
    this.playlistAutoplay = true;
    this.playlistRepeat = false;
    this.playlistShuffle = false;
    this._ytPlayer = null;
    this._ytApiPromise = null;

    this.dataCache = this.loadCatalog();
    this.root = document.getElementById('root');

    // Memoization caches — invalidated via _dataRevision whenever the catalog,
    // subscriptions or live-fetched videos change (see bumpDataRevision()).
    // Without these, every click re-flattened 1000+ videos and rebuilt the
    // related-videos graph from scratch (multi-second main-thread freezes).
    this._dataRevision = 0;
    this._allVideosCache = null;
    this._allVideosRev = -1;
    this._allPlaylistsCache = null;
    this._allPlaylistsRev = -1;
    this._relatedEngines = new Map();

    // Modals
    this.showAddModal = false;
    this.showUserModal = false;

    // Isolated single-video route (e.g. #/v/dQw4w9WgXcQ)
    // Totally separate from the feed/recommendations — just player + title + duration + description.
    this.isolatedVideoId = null;
    this.isolatedVideoData = null;

    // Shareable deep-link router: #/channel/<slug>, #/channel/<slug>/playlist/<id>,
    // #/channel/<slug>/playlist/<id>/video/<n>, #/channel/<slug>/video/<videoId>, #/v/<videoId>
    this.applyRoute(this.parseRoute(), { initial: true });
    window.addEventListener('hashchange', () => {
      this.applyRoute(this.parseRoute());
      this.render();
      this.scrollMainToTop();
    });

    this.init();
  }

  // ============================================================================
  // APP INIT
  // ============================================================================
  init() {
    this.render();
    this.setupEventListeners();
    this.warmRelatedEngines();
    if (!this.isolatedVideoId) {
      this.subscribedChannels.forEach(ch => this.fetchLiveChannelData(ch.id));
    }
  }

  // ============================================================================
  // DATA ACCESS HELPERS (used heavily by views & router)
  // ============================================================================
  // Bump whenever a cached flattening/graph could go stale (catalog save,
  // subscription changes, live-fetched videos). Caches below compare against it.
  bumpDataRevision() {
    this._dataRevision = (this._dataRevision || 0) + 1;
  }

  getAllCachedVideos() {
    if (this._allVideosCache && this._allVideosRev === this._dataRevision) {
      return this._allVideosCache;
    }
    let all = [];
    this.subscribedChannels.forEach(ch => {
      const cat = this.dataCache[ch.id];
      if (cat && cat.videos) {
        all = all.concat(cat.videos.map(v => ({
          ...v,
          avatarColor: ch.avatarColor || 'bg-red-600',
          initials: ch.initials || 'YT'
        })));
      }
    });
    this._allVideosCache = all;
    this._allVideosRev = this._dataRevision;
    return all;
  }

  getAllCachedPlaylists() {
    if (this._allPlaylistsCache && this._allPlaylistsRev === this._dataRevision) {
      return this._allPlaylistsCache;
    }
    let all = [];
    this.subscribedChannels.forEach(ch => {
      const cat = this.dataCache[ch.id];
      if (cat && cat.playlists) {
        all = all.concat(cat.playlists.map(p => ({
          ...p,
          channelId: ch.id,
          channelName: ch.name
        })));
      }
    });
    this._allPlaylistsCache = all;
    this._allPlaylistsRev = this._dataRevision;
    return all;
  }

  // Looks up which playlist (if any) a video belongs to, so the watch page can
  // show that playlist's full queue in the sidebar even when the video was opened
  // from the home feed or search results (not via a playlist link). Prefers a
  // playlist from the video's own channel, then any playlist containing it.
  findPlaylistForVideo(video) {
    if (!video || !video.id) return null;
    const pls = this.getAllCachedPlaylists();
    const mine = pls.find(p =>
      p.channelId === video.channelId &&
      Array.isArray(p.videos) && p.videos.includes(video.id)
    );
    if (mine) return mine;
    return pls.find(p => Array.isArray(p.videos) && p.videos.includes(video.id)) || null;
  }

  // Classifies a video into a feed category using the reliable `Subject:`
  // field carried in the catalog descriptions (e.g. "Subject: Physics"),
  // rather than fragile title keywords. Returns 'science' | 'math' | 'other'.
  classifyVideoSubject(video) {
    const desc = (video && video.description) || '';
    const m = desc.match(/Subject:\s*([A-Za-z][A-Za-z ]*)/);
    const subject = m ? m[1].trim().toLowerCase() : '';
    if (subject === 'physics' || subject === 'chemistry' || subject === 'biology') {
      return 'science';
    }
    if (subject.includes('math')) {
      return 'math';
    }
    return 'other';
  }

  // Related-videos graph is O(n) to build now, but still ~200ms for the
  // 998-video channel — so build it once per channel and reuse it forever
  // (invalidated when the video count for that channel changes).
  getRelatedEngine(channelId, channelVids) {
    if (!this._relatedEngines) this._relatedEngines = new Map();
    const key = channelId + ':' + channelVids.length;
    let engine = this._relatedEngines.get(key);
    if (!engine) {
      engine = new RelatedVideosEngine(channelVids);
      this._relatedEngines.set(key, engine);
    }
    return engine;
  }

  // Pre-build the graphs during idle time right after boot, so the first video
  // click has nothing left to compute. Done one channel per idle callback: a
  // ~1000-video channel takes ~300ms to graph, so building them all in a single
  // task would freeze the UI for a noticeable beat.
  warmRelatedEngines() {
    const all = this.getAllCachedVideos();
    const jobs = this.subscribedChannels
      .map(ch => ({ id: ch.id, vids: all.filter(v => v.channelId === ch.id) }))
      .filter(j => j.vids.length);

    const step = () => {
      const job = jobs.shift();
      if (!job) return;
      this.getRelatedEngine(job.id, job.vids);
      if (jobs.length) {
        if (typeof requestIdleCallback === 'function') requestIdleCallback(step, { timeout: 2000 });
        else setTimeout(step, 50);
      }
    };

    if (typeof requestIdleCallback === 'function') requestIdleCallback(step, { timeout: 3000 });
    else setTimeout(step, 500);
  }

  // ============================================================================
  // VIDEO GRID PAGINATION (incremental render + infinite scroll)
  // ----------------------------------------------------------------------------
  // Large channels (OnnoRokom ~1000 videos) made switching channels janky because
  // every card was injected into innerHTML in one 1MB+ parse. We now render one
  // page at a time and append more as the user scrolls, keeping the main thread
  // responsive regardless of catalog size.
  // ============================================================================
  GRID_PAGE_SIZE = 48;

  // Shared video-card markup so home, search and channel grids stay identical.
  videoCardHtml(v) {
    return `
      <div data-vid="${v.id}" data-ch="${v.channelId}" class="yt-video-card flex flex-col gap-3 group">
        <div class="relative aspect-video w-full rounded-xl overflow-hidden bg-[#222222]">
          <img src="${v.thumbnail}" alt="${v.title}" loading="lazy" decoding="async" class="yt-thumb-img w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          <span class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium font-mono tracking-tight">
            ${v.duration}
          </span>
        </div>
        <div class="flex items-start gap-3 px-0.5">
          <div data-goto-ch="${v.channelId}" class="w-9 h-9 rounded-full ${v.avatarColor || 'bg-red-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 hover:scale-105 transition" title="${v.channelName}">
            ${v.initials || 'YT'}
          </div>
          <div class="flex flex-col gap-1 pr-2">
            <h3 class="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3ea6ff] transition">${v.title}</h3>
            <div class="text-xs text-[#aaa] flex flex-col">
              <span data-goto-ch="${v.channelId}" class="hover:text-white transition w-fit">${v.channelName}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  // Builds a paged grid: the first page is inlined, the rest stream in via the
  // sentinel below as it scrolls into view. `getList()` returns the full array
  // on demand so the grid always reflects the current data without re-rendering.
  pagedVideoGridHtml(getList) {
    this._gridGetList = getList;
    const all = getList();
    const first = all.slice(0, this.GRID_PAGE_SIZE);
    const hasMore = all.length > first.length;
    return `
      <div id="yt-video-grid" class="p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        ${first.map(v => this.videoCardHtml(v)).join('')}
      </div>
      ${hasMore ? `
        <div id="yt-grid-sentinel" class="flex items-center justify-center py-8">
          <span class="text-xs text-[#888] animate-pulse">Loading more…</span>
        </div>
      ` : ''}
    `;
  }

  // Re-attaches the IntersectionObserver for the current grid. Safe to call on
  // every render; the previous observer is always torn down first.
  setupGridInfiniteScroll() {
    if (this._gridObserver) {
      this._gridObserver.disconnect();
      this._gridObserver = null;
    }
    const sentinel = document.getElementById('yt-grid-sentinel');
    const grid = document.getElementById('yt-video-grid');
    if (!sentinel || !grid || !this._gridGetList) return;

    this._gridRendered = this.GRID_PAGE_SIZE;

    const loadMore = () => {
      const all = this._gridGetList ? this._gridGetList() : [];
      if (this._gridRendered >= all.length) return;
      const next = all.slice(this._gridRendered, this._gridRendered + this.GRID_PAGE_SIZE);
      const frag = document.createElement('div');
      frag.innerHTML = next.map(v => this.videoCardHtml(v)).join('');
      const nodes = Array.from(frag.children);
      nodes.forEach(n => grid.appendChild(n));
      this._gridRendered += next.length;

      if (this._gridRendered >= all.length) {
        const s = document.getElementById('yt-grid-sentinel');
        if (s) s.remove();
        if (this._gridObserver) { this._gridObserver.disconnect(); this._gridObserver = null; }
      }
    };

    if (typeof IntersectionObserver === 'function') {
      this._gridObserver = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) loadMore();
      }, { rootMargin: '600px 0px' });
      this._gridObserver.observe(sentinel);
    } else {
      // Very old engines: one extra page, then a manual tap to continue.
      sentinel.innerHTML = `<button class="px-4 py-2 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-white text-xs font-medium">Load more</button>`;
      sentinel.firstElementChild.onclick = loadMore;
    }
  }

  // Clears paging state so the next view starts from page 1.
  resetGridPaging() {
    if (this._gridObserver) {
      this._gridObserver.disconnect();
      this._gridObserver = null;
    }
    this._gridGetList = null;
    this._gridRendered = 0;
  }

  // Bottom tab bar for phones (hidden at lg+ where the persistent sidebar takes
  // over). Gives one-tap thumb-reach navigation like the YouTube mobile app,
  // replacing the need to open the hamburger drawer for channels/playlists.
  renderMobileBottomNav() {
    const item = (action, label, svg, active) => `
      <button data-nav-action="${action}" class="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium ${active ? 'text-white' : 'text-[#aaa]'} active:opacity-70">
        ${svg}
        <span>${label}</span>
      </button>`;

    const home = this.activeView === 'home' && !this.watchVideo;
    const subs = this.activeView === 'subscriptions' && !this.watchVideo;
    const lib = (this.activeView === 'library' || this.activeView === 'playlist_detail') && !this.watchVideo;
    const chans = this.activeView === 'channel' && !this.watchVideo;

    return `
      <nav id="mobile-bottom-nav" class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0f0f0f]/95 backdrop-blur border-t border-[#272727] pb-safe-bottom">
        <div class="flex items-stretch h-14 pt-safe-bottom">
          ${item('home', 'Home', `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`, home)}
          ${item('subscriptions', 'Subs', `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8H4V6h16v2zm-2-4H6v2h12V4zM20 10H4v10h16V10zm-8 8l5-4-5-4v8z"/></svg>`, subs)}
          ${item('library', 'Playlists', `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>`, lib)}
          ${item('channels', 'Channels', `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`, chans)}
          ${item('search', 'Search', `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`, false)}
        </div>
      </nav>`;
  }

  // ============================================================================
  // MAIN RENDER FRAMEWORK (shell: navbar + sidebar + modals)
  // ============================================================================
  render() {
    this.updateSeoMeta();
    if (this.isolatedVideoId) {
      this.renderIsolatedPage();
      return;
    }

    this.root.innerHTML = `
      <div class="flex flex-col min-h-[100dvh] bg-[#0f0f0f] text-[#f1f1f1] select-none font-sans">
        
        <!-- TOP NAVBAR -->
        <header class="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur h-14 px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-2 border-b border-[#272727] pt-safe-top">
          
          <!-- LEFT BRANDING -->
          <div class="flex items-center gap-1 sm:gap-4 shrink-0">
            <button id="toggle-sidebar-btn" class="hidden lg:block p-2 rounded-full hover:bg-[#272727] text-[#f1f1f1] transition shrink-0">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
            </button>
            <div id="nav-logo-btn" class="flex items-center gap-2 cursor-pointer shrink-0">
              <div class="bg-[#ff0000] text-white px-2 py-0.5 rounded-[6px] font-black tracking-tighter text-sm flex items-center justify-center shadow">
                <svg class="w-4 h-4 fill-white inline mr-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span class="hidden sm:inline font-bold text-lg tracking-tight text-white font-sans">FocusTube</span>
            </div>
          </div>

          <!-- CENTER SEARCH BAR -->
          <div class="flex items-center flex-1 min-w-0 max-w-xl mx-1 sm:mx-4">
            <div class="flex flex-1 min-w-0 items-center bg-[#121212] border border-[#303030] rounded-l-full px-2.5 sm:px-4 py-1.5 focus-within:border-[#3ea6ff]">
              <input type="text" id="yt-search-input" value="${this.searchQuery}" placeholder="Search" class="w-full min-w-0 bg-transparent text-sm text-white placeholder-[#888] focus:outline-none" />
              ${this.searchQuery ? `<button id="clear-search-btn" class="text-[#aaa] hover:text-white shrink-0">${ICONS.close}</button>` : ''}
            </div>
            <button id="submit-search-btn" class="shrink-0 bg-[#222222] border border-l-0 border-[#303030] hover:bg-[#272727] px-3 sm:px-6 py-2 rounded-r-full text-[#f1f1f1] transition">
              ${ICONS.search}
            </button>
          </div>

          <!-- RIGHT RAIL TOOLS -->
          <div class="flex items-center gap-1 sm:gap-3 shrink-0">
            <button id="add-channel-modal-btn" class="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#272727] hover:bg-[#3f3f3f] rounded-full text-xs font-medium text-white transition">
              <svg class="w-4 h-4 text-[#ff0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              <span>Add Channel</span>
            </button>

            <button id="change-user-modal-btn" class="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-[#272727] text-xs font-medium transition" title="Change Username">
              <div class="w-7 h-7 rounded-full bg-[#3ea6ff] text-black font-bold flex items-center justify-center uppercase shadow shrink-0">
                ${this.userName.charAt(0)}
              </div>
              <span class="hidden md:inline text-[#f1f1f1] max-w-[90px] truncate">${this.userName}</span>
            </button>
          </div>
        </header>

        <!-- APP WORKSPACE: LEFT SIDEBAR + MAIN CONTENT AREA -->
        <div class="flex flex-1 overflow-hidden relative">

          <!-- MOBILE SIDEBAR BACKDROP -->
          <div id="sidebar-backdrop" class="${this.sidebarExpanded ? 'fixed inset-0 bg-black/60 z-30 lg:hidden' : 'hidden'}"></div>

          <!-- LEFT DRAWER SIDEBAR: slide-over on mobile, persistent mini/full rail on lg+ -->
          <aside id="yt-sidebar" class="${this.sidebarExpanded ? 'translate-x-0 w-72 sm:w-64 lg:w-60' : '-translate-x-full lg:translate-x-0 w-72 sm:w-64 lg:w-18'} fixed lg:static inset-y-0 left-0 top-14 lg:top-auto h-[calc(100%-3.5rem)] lg:h-auto shrink-0 bg-[#0f0f0f] border-r border-[#272727]/60 overflow-y-auto flex flex-col pt-3 transition-transform lg:transition-all duration-200 z-30">
            
            <div class="px-3 flex flex-col gap-1">
              <div data-nav="home" class="yt-sidebar-item ${this.activeView === 'home' && !this.selectedChannelId ? 'active' : ''}">
                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                <span class="${this.sidebarExpanded ? '' : 'hidden'} text-sm">Home</span>
              </div>

              <div data-nav="subscriptions" class="yt-sidebar-item ${this.activeView === 'subscriptions' ? 'active' : ''}">
                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18.7 8.7H5.3V7h13.4v1.7zm-3.4-3.4H8.7V3.6h6.6v1.7zM22 12v8H2v-8h20zM4 18h16v-4.3H4V18z"/></svg>
                <span class="${this.sidebarExpanded ? '' : 'hidden'} text-sm">Subscriptions</span>
              </div>

              <div data-nav="library" class="yt-sidebar-item ${this.activeView === 'library' || this.activeView === 'playlist_detail' ? 'active' : ''}">
                <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
                <span class="${this.sidebarExpanded ? '' : 'hidden'} text-sm">Playlists</span>
              </div>
            </div>

            ${this.sidebarExpanded ? `
              <div class="my-3 border-t border-[#272727] mx-3"></div>
              
              <div class="px-6 py-2 flex items-center justify-between">
                <span class="text-xs font-bold uppercase text-[#aaa] tracking-wider font-sans">Subscriptions (${this.subscribedChannels.length})</span>
                <button id="sidebar-add-ch-btn" class="text-[#3ea6ff] text-xs hover:underline">+ Add</button>
              </div>

              <!-- SUBSCRIBED CHANNELS LIST -->
              <div class="flex flex-col px-3 pb-6 gap-0.5">
                ${this.subscribedChannels.map(ch => `
                  <div data-sidebar-ch="${ch.id}" class="yt-sidebar-item ${this.activeView === 'channel' && this.selectedChannelId === ch.id ? 'active' : ''}">
                    <div class="w-6 h-6 rounded-full ${ch.avatarColor || 'bg-red-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow">
                      ${ch.initials || 'CH'}
                    </div>
                    <span class="truncate text-sm text-[#f1f1f1] flex-1">${ch.name}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- FOOTER INFO IN SIDEBAR -->
            <div class="mt-auto p-4 border-t border-[#272727] ${this.sidebarExpanded ? '' : 'hidden'}">
              <p class="text-[11px] text-[#888] leading-relaxed">
                FreeTube WebApp v2.0<br>Open Source YouTube Client.<br>&copy; 2026 Radif Hassan.
              </p>
            </div>
            <div class="lg:hidden" style="height: calc(var(--bottom-nav-h) + var(--safe-bottom));"></div>
          </aside>

          <!-- MAIN BODY CONTENT -->
          <main id="yt-body-content" class="flex-1 overflow-y-auto bg-[#0f0f0f] relative pb-nav">
            <!-- Dynamically populated -->
          </main>

        </div>

        ${this.renderMobileBottomNav()}

        <!-- ADD CHANNEL MODAL DIALOG -->
        <div id="add-channel-modal" class="${this.showAddModal ? 'flex' : 'hidden'} fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4 animate-in fade-in duration-150">
          <div class="bg-[#212121] border border-[#3f3f3f] rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-[#3f3f3f] pb-3">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-[#ff0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Subscribe to YouTube Channel
              </h3>
              <button id="close-add-modal" class="text-[#aaa] hover:text-white">${ICONS.close}</button>
            </div>

            <form id="add-ch-form" class="flex flex-col gap-4">
              <div>
                <label class="block text-xs font-medium text-[#aaa] mb-1.5">YouTube Handle (@name), Channel ID or URL</label>
                <input type="text" id="add-ch-input" required placeholder="e.g. @Veritasium or https://youtube.com/@mkbhd" class="w-full bg-[#121212] border border-[#3f3f3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ea6ff]" />
              </div>
              <p id="add-modal-status" class="text-xs text-[#3ea6ff] hidden"></p>
              
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" id="cancel-add-btn" class="px-4 py-2 rounded-full hover:bg-[#3f3f3f] text-sm text-[#aaa]">Cancel</button>
                <button type="submit" class="px-6 py-2 rounded-full bg-[#3ea6ff] hover:bg-[#65bbf7] text-black font-bold text-sm shadow">Subscribe</button>
              </div>
            </form>
          </div>
        </div>

        <!-- USER PROFILE MODAL -->
        <div id="user-modal" class="${this.showUserModal ? 'flex' : 'hidden'} fixed inset-0 z-50 bg-black/80 backdrop-blur-sm items-center justify-center p-4 animate-in fade-in duration-150">
          <div class="bg-[#212121] border border-[#3f3f3f] rounded-2xl max-w-sm w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-[#3f3f3f] pb-3">
              <h3 class="text-base font-bold text-white">Edit User Profile</h3>
              <button id="close-user-modal" class="text-[#aaa] hover:text-white">${ICONS.close}</button>
            </div>
            <form id="edit-user-form" class="flex flex-col gap-4">
              <input type="text" id="edit-username-input" required value="${this.userName}" placeholder="Your Name" class="w-full bg-[#121212] border border-[#3f3f3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3ea6ff]" />
              <button type="submit" class="w-full py-2.5 rounded-full bg-[#3ea6ff] text-black font-bold text-sm">Save Profile</button>
            </form>
          </div>
        </div>

      </div>
    `;

    this.renderBody();
  }

  renderBody() {
    const main = document.getElementById('yt-body-content');
    if (!main) return;

    // Keep the playing iframe alive across watch-page re-renders (see watch.js).
    this.capturePlayerShell();

    if (this.watchVideo) {
      main.innerHTML = this.renderWatchVideoPageHtml();
      this.restorePlayerShell();
      this.attachWatchPageListeners();
      this.resetGridPaging();
      return;
    }

    if (this.activeView === 'home' || this.activeView === 'subscriptions') {
      main.innerHTML = this.renderHomePageHtml();
      this.setupGridInfiniteScroll();
    } else if (this.activeView === 'search') {
      main.innerHTML = this.renderSearchResultsPageHtml();
      this.setupGridInfiniteScroll();
    } else if (this.activeView === 'channel' && this.selectedChannelId) {
      const ch = this.subscribedChannels.find(c => c.id === this.selectedChannelId) || this.subscribedChannels[0];
      main.innerHTML = this.renderChannelPageHtml(ch);
      this.setupGridInfiniteScroll();
    } else if (this.activeView === 'library') {
      main.innerHTML = this.renderLibraryPageHtml();
      this.resetGridPaging();
    } else if (this.activeView === 'playlist_detail' && this.selectedPlaylist) {
      main.innerHTML = this.renderPlaylistDetailPageHtml(this.selectedPlaylist);
      this.resetGridPaging();
    } else {
      // Safety net: any state that doesn't map to a view falls back to Home, so
      // the previous page is never left stale on screen.
      this.activeView = 'home';
      main.innerHTML = this.renderHomePageHtml();
      this.setupGridInfiniteScroll();
    }
  }

  // ============================================================================
  // FORMATTERS (delegate to shared utils so there's a single source of truth)
  // ============================================================================
  formatSeconds(sec) { return formatSeconds(sec); }
  formatNumber(num) { return formatNumber(num); }
  escapeHtml(str) { return escapeHtml(str); }
}

// Every feature module is a plain object of methods on the prototype — this
// keeps `this` semantics identical to a single big class body while letting
// each concern live in its own file.
Object.assign(FreeTubeApp.prototype,
  routerMixin,
  seoMixin,
  storageMixin,
  apiMixin,
  playerMixin,
  viewsMixin,
  eventsMixin
);

export default FreeTubeApp;