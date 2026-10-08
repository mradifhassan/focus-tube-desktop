/**
 * @file views/library.js
 * "Saved Playlists" library — a grid of every cached playlist across the
 * user's subscribed channels.
 */

import { ICONS } from '../icons.js';

export const libraryViewMixin = {
  renderLibraryPageHtml() {
    const pls = this.getAllCachedPlaylists();
    return `
      <div class="p-6 lg:p-10 flex flex-col gap-6">
        <h1 class="text-2xl font-bold text-white">Saved Playlists (${pls.length})</h1>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${pls.map(pl => `
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
    `;
  },
};