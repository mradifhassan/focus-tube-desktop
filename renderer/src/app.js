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
    this.feedFilter = 'all'; // 'all' | 'playlists' | 'science' | 'tech' | 'recently'
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
    });

    this.init();
  }

  // ============================================================================
  // APP INIT
  // ============================================================================
  init() {
    this.render();
    this.setupEventListeners();
    if (!this.isolatedVideoId) {
      this.subscribedChannels.forEach(ch => this.fetchLiveChannelData(ch.id));
    }
  }

  // ============================================================================
  // DATA ACCESS HELPERS (used heavily by views & router)
  // ============================================================================
  getAllCachedVideos() {
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
    return all;
  }

  getAllCachedPlaylists() {
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
    return all;
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
      <div class="flex flex-col min-h-screen bg-[#0f0f0f] text-[#f1f1f1] select-none font-sans">
        
        <!-- TOP NAVBAR -->
        <header class="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur h-14 px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-2 border-b border-[#272727]">
          
          <!-- LEFT BRANDING -->
          <div class="flex items-center gap-1 sm:gap-4 shrink-0">
            <button id="toggle-sidebar-btn" class="p-2 rounded-full hover:bg-[#272727] text-[#f1f1f1] transition shrink-0">
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
          </aside>

          <!-- MAIN BODY CONTENT -->
          <main id="yt-body-content" class="flex-1 overflow-y-auto bg-[#0f0f0f] relative">
            <!-- Dynamically populated -->
          </main>

        </div>

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
      return;
    }

    if (this.activeView === 'home' || this.activeView === 'subscriptions') {
      main.innerHTML = this.renderHomePageHtml();
    } else if (this.activeView === 'search') {
      main.innerHTML = this.renderSearchResultsPageHtml();
    } else if (this.activeView === 'channel' && this.selectedChannelId) {
      const ch = this.subscribedChannels.find(c => c.id === this.selectedChannelId) || this.subscribedChannels[0];
      main.innerHTML = this.renderChannelPageHtml(ch);
    } else if (this.activeView === 'library') {
      main.innerHTML = this.renderLibraryPageHtml();
    } else if (this.activeView === 'playlist_detail' && this.selectedPlaylist) {
      main.innerHTML = this.renderPlaylistDetailPageHtml(this.selectedPlaylist);
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