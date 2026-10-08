/**
 * @file events.js
 * Global event listeners: navigation clicks, video/playlist cards,
 * category chips, channel tabs, modals, search, subscribe & profile forms.
 */

export const eventsMixin = {
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Toggle Sidebar (opens/closes the drawer on mobile, mini/full rail on lg+)
      if (e.target.closest('#toggle-sidebar-btn')) {
        this.sidebarExpanded = !this.sidebarExpanded;
        this.render();
      }

      // Tapping the backdrop closes the mobile drawer
      if (e.target.id === 'sidebar-backdrop') {
        this.sidebarExpanded = false;
        this.render();
      }

      // Tapping a nav/channel/playlist item on mobile should close the drawer after navigating
      if (this.isMobile && (e.target.closest('[data-nav]') || e.target.closest('[data-sidebar-ch]'))) {
        this.sidebarExpanded = false;
      }

      // Logo Home
      if (e.target.closest('#nav-logo-btn')) {
        this.watchVideo = null;
        this.activeView = 'home';
        this.selectedChannelId = null;
        this.selectedPlaylist = null;
        this.searchQuery = '';
        this.renderBody();
        this.syncHash();
      }

      // Sidebar Navigation items
      const navItem = e.target.closest('[data-nav]');
      if (navItem) {
        this.watchVideo = null;
        this.activeView = navItem.getAttribute('data-nav');
        this.selectedChannelId = null;
        this.selectedPlaylist = null;
        this.render();
        this.syncHash();
      }

      // Sidebar Channel selection
      const sidebarCh = e.target.closest('[data-sidebar-ch]');
      if (sidebarCh) {
        this.watchVideo = null;
        this.activeView = 'channel';
        this.selectedChannelId = sidebarCh.getAttribute('data-sidebar-ch');
        this.selectedPlaylist = null;
        this.channelTab = 'videos';
        this.render();
        this.syncHash();
      }

      // Click Playlist Card -> Playlist Detail View
      const plCard = e.target.closest('[data-pl]');
      if (plCard) {
        const plId = plCard.getAttribute('data-pl');
        const allPls = this.getAllCachedPlaylists();
        const foundPl = allPls.find(p => p.id === plId) || allPls[0];
        if (foundPl) {
          this.watchVideo = null;
          this.activeView = 'playlist_detail';
          this.selectedPlaylist = foundPl;
          this.scrollMainToTop();
          this.render();
          this.syncHash();
        }
        return;
      }

      // Back button in Playlist Detail View
      if (e.target.closest('#playlist-back-btn')) {
        this.activeView = 'library';
        this.selectedPlaylist = null;
        this.render();
        this.syncHash();
        return;
      }

      // Feed Category Filter chips
      const filterChip = e.target.closest('[data-filter]');
      if (filterChip) {
        this.feedFilter = filterChip.getAttribute('data-filter');
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        filterChip.classList.add('active');
        this.renderBody();
      }

      // Channel Tabs switch (Videos | Playlists | About)
      const chTab = e.target.closest('[data-ch-tab]');
      if (chTab) {
        this.channelTab = chTab.getAttribute('data-ch-tab');
        this.renderBody();
      }

      // Click Video Card -> Watch Page
      const vidCard = e.target.closest('[data-vid]');
      if (vidCard && !e.target.closest('[data-goto-ch]')) {
        const vidId = vidCard.getAttribute('data-vid');
        const all = this.getAllCachedVideos();
        const found = all.find(v => v.id === vidId) || { id: vidId, title: "YouTube Video", channelId: vidCard.getAttribute('data-ch') };

        // Only keep playlist queue/autoplay context when the click came from a playlist-aware card
        // (the playlist detail page, or the in-watch-page playlist queue panel).
        if (!vidCard.hasAttribute('data-in-playlist')) {
          this.selectedPlaylist = null;
        }

        this.watchHistoryStack = [];
        this.watchVideo = found;
        this.scrollMainToTop();
        this.renderBody();
        this.syncHash();
      }

      // Go to Channel from Video Card avatar or title
      const gotoCh = e.target.closest('[data-goto-ch]');
      if (gotoCh) {
        this.watchVideo = null;
        this.activeView = 'channel';
        this.selectedChannelId = gotoCh.getAttribute('data-goto-ch');
        this.selectedPlaylist = null;
        this.channelTab = 'videos';
        this.render();
        this.syncHash();
      }

      // Open Add Channel Modal
      if (e.target.closest('#add-channel-modal-btn') || e.target.closest('#sidebar-add-ch-btn')) {
        this.showAddModal = true;
        this.render();
      }

      // Close Add Channel Modal
      if (e.target.closest('#close-add-modal') || e.target.closest('#cancel-add-btn')) {
        this.showAddModal = false;
        this.render();
      }

      // Open User Modal
      if (e.target.closest('#change-user-modal-btn')) {
        this.showUserModal = true;
        this.render();
      }

      // Close User Modal
      if (e.target.closest('#close-user-modal')) {
        this.showUserModal = false;
        this.render();
      }

      // Unsubscribe Channel
      const delCh = e.target.closest('[data-del-ch]');
      if (delCh) {
        const dId = delCh.getAttribute('data-del-ch');
        if (confirm("Unsubscribe from this channel?")) {
          this.subscribedChannels = this.subscribedChannels.filter(c => c.id !== dId);
          this.saveChannels();
          this.activeView = 'home';
          this.selectedChannelId = null;
          this.render();
          this.syncHash();
        }
      }

      // Submit Search Btn
      if (e.target.closest('#submit-search-btn')) {
        const sInput = document.getElementById('yt-search-input');
        if (sInput && sInput.value.trim()) {
          this.searchQuery = sInput.value.trim();
          this.activeView = 'search';
          this.watchVideo = null;
          this.render();
        }
      }

      // Clear Search Btn
      if (e.target.closest('#clear-search-btn')) {
        this.searchQuery = '';
        this.activeView = 'home';
        this.render();
      }
    });

    // Search Input Enter key
    document.addEventListener('keydown', (e) => {
      const searchInput = document.getElementById('yt-search-input');
      if (e.key === 'Enter' && searchInput && document.activeElement === searchInput) {
        e.preventDefault();
        const val = searchInput.value.trim();
        if (val) {
          this.searchQuery = val;
          this.activeView = 'search';
          this.watchVideo = null;
          this.render();
        }
      }
    });

    // Add Channel Form Submit
    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'add-ch-form') {
        e.preventDefault();
        const input = document.getElementById('add-ch-input');
        const status = document.getElementById('add-modal-status');
        if (!input) return;
        const val = input.value.trim();

        status.classList.remove('hidden');
        status.textContent = "Fetching channel information...";

        let chId = val;
        let handle = '';
        let name = val;

        if (val.includes('youtube.com/')) {
          const match = val.match(/@([a-zA-Z0-9_.-]+)/);
          if (match) { handle = '@' + match[1]; name = match[1]; }
          const idMatch = val.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
          if (idMatch) chId = idMatch[1];
        } else if (val.startsWith('@')) {
          handle = val; name = val.substring(1);
        }

        if (!chId.startsWith('UC')) {
          let h = 0;
          for (let i=0; i<val.length; i++) h = ((h<<5)-h)+val.charCodeAt(i)|0;
          chId = 'UC_LOCAL_' + Math.abs(h).toString(16).toUpperCase();
        }

        const newCh = {
          id: chId,
          name: name,
          handle: handle || '@channel',
          avatarColor: ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600'][Math.floor(Math.random()*5)],
          initials: name.substring(0,2).toUpperCase(),
          subscriberCount: "Subscribed",
          description: `Channel added via link (${val}).`
        };

        if (!this.subscribedChannels.some(c => c.id === newCh.id)) {
          this.subscribedChannels.push(newCh);
          this.saveChannels();
        }

        status.textContent = "Success! Loading videos...";
        await this.fetchLiveChannelData(newCh.id);

        setTimeout(() => {
          this.showAddModal = false;
          this.selectedChannelId = newCh.id;
          this.activeView = 'channel';
          this.render();
          this.syncHash();
        }, 600);
      }

      // Edit Username Form
      if (e.target && e.target.id === 'edit-user-form') {
        e.preventDefault();
        const uInput = document.getElementById('edit-username-input');
        if (uInput) {
          this.userName = uInput.value.trim() || 'Radif Hassan';
          localStorage.setItem('yt_user_name', this.userName);
          this.showUserModal = false;
          this.render();
        }
      }
    });
  },
};