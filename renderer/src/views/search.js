/**
 * @file views/search.js
 * Search results page — playlist cards plus video cards, or an empty state.
 */

import { ICONS } from '../icons.js';

export const searchViewMixin = {
  renderSearchResultsPageHtml() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.activeView = 'home';
      return this.renderHomePageHtml();
    }

    // Search across all cached videos
    const allVideos = this.getAllCachedVideos();
    const matchedVideos = allVideos.filter(v =>
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.channelName && v.channelName.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    );

    // Search across all cached playlists
    const allPlaylists = this.getAllCachedPlaylists();
    const matchedPlaylists = allPlaylists.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.channelName && p.channelName.toLowerCase().includes(q))
    );

    const totalResults = matchedVideos.length + matchedPlaylists.length;

    return `
      <div class="p-6 lg:p-10 flex flex-col gap-8">
        <!-- SEARCH HEADER -->
        <div class="flex flex-col gap-2">
          <h1 class="text-2xl font-bold text-white">
            Search results for "<span class="text-[#3ea6ff]">${this.escapeHtml(this.searchQuery)}</span>"
          </h1>
          <p class="text-sm text-[#aaa]">${totalResults} result${totalResults !== 1 ? 's' : ''} found across your subscriptions</p>
        </div>

        ${matchedPlaylists.length > 0 ? `
          <!-- PLAYLISTS SECTION -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3 border-b border-[#272727] pb-3">
              <svg class="w-5 h-5 text-[#3ea6ff]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
              <h2 class="text-lg font-bold text-white">Playlists (${matchedPlaylists.length})</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              ${matchedPlaylists.map(pl => `
                <div data-pl="${pl.id}" class="bg-[#1f1f1f] rounded-2xl overflow-hidden hover:bg-[#272727] transition cursor-pointer flex flex-col group border border-[#272727]">
                  <div class="relative aspect-video bg-[#111]">
                    <img src="${pl.thumbnail}" alt="${pl.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span class="text-white font-bold text-sm flex items-center gap-1.5 bg-red-600 px-4 py-2 rounded-full shadow">${ICONS.play} View Playlist</span>
                    </div>
                    <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono font-bold">
                      &#9776; ${pl.videoCount || (pl.videos ? pl.videos.length : 0)} Videos
                    </span>
                  </div>
                  <div class="p-4 flex flex-col gap-1">
                    <h3 class="text-sm font-bold text-white truncate group-hover:text-[#3ea6ff]">${pl.title}</h3>
                    <p class="text-xs text-[#aaa]">${pl.channelName}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${matchedVideos.length > 0 ? `
          <!-- VIDEOS SECTION -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3 border-b border-[#272727] pb-3">
              <svg class="w-5 h-5 text-[#ff0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
              <h2 class="text-lg font-bold text-white">Videos (${matchedVideos.length})</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              ${matchedVideos.map(v => `
                <div data-vid="${v.id}" data-ch="${v.channelId}" class="yt-video-card flex flex-col gap-3 group">
                  <div class="relative aspect-video w-full rounded-xl overflow-hidden bg-[#222222]">
                    <img src="${v.thumbnail}" alt="${v.title}" class="yt-thumb-img w-full h-full object-cover group-hover:scale-105 transition duration-300" />
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
                        <span>${v.views} &bull; ${v.publishedText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${totalResults === 0 ? `
          <!-- NO RESULTS -->
          <div class="flex flex-col items-center justify-center py-20 gap-4">
            <svg class="w-16 h-16 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <h2 class="text-xl font-bold text-white">No results found</h2>
            <p class="text-sm text-[#aaa] text-center max-w-md">
              We couldn't find any videos or playlists matching "<span class="text-[#3ea6ff]">${this.escapeHtml(this.searchQuery)}</span>".<br>
              Try different keywords or check your spelling.
            </p>
          </div>
        ` : ''}
      </div>
    `;
  },
};