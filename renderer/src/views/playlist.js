/**
 * @file views/playlist.js
 * Dedicated playlist detail view: sticky rail with thumbnail + controls on
 * the left, the playlist's videos listed on the right.
 */

import { ICONS } from '../icons.js';

export const playlistViewMixin = {
  renderPlaylistDetailPageHtml(playlist) {
    const allVids = this.getAllCachedVideos();
    const plVideos = (playlist.videos || []).map(vidId => {
      return allVids.find(v => v.id === vidId) || {
        id: vidId,
        title: "YouTube Broadcast (" + vidId + ")",
        duration: "15:40",
        views: "124K views",
        publishedText: "Recently",
        thumbnail: "https://i.ytimg.com/vi/" + vidId + "/hqdefault.jpg",
        channelId: playlist.channelId || "UC8SDY8Wr6s6DIofumkZGfxg",
        channelName: playlist.channelName || "YouTube Channel"
      };
    });

    return `
      <!-- BREADCRUMB HEADER -->
      <div class="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur px-6 py-3 border-b border-[#272727] flex items-center gap-3">
        <button id="playlist-back-btn" class="flex items-center gap-2 px-4 py-1.5 bg-[#272727] hover:bg-[#3f3f3f] text-white font-semibold text-xs rounded-full transition">
          <span>&larr;</span> Back to Playlists
        </button>
        <span class="text-sm font-bold text-white ml-2">Playlist</span>
        <span class="text-xs text-[#aaa] truncate">&bull; ${playlist.title}</span>
      </div>

      <div class="p-6 lg:p-10 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        <!-- LEFT RAIL (STICKY CARD) -->
        <div class="w-full lg:w-80 shrink-0">
          <div class="sticky top-20 bg-gradient-to-b from-[#303030] to-[#1a1a1a] rounded-3xl p-6 border border-[#383838] flex flex-col gap-5 shadow-2xl">
            <div class="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
              <img src="${playlist.thumbnail}" alt="${playlist.title}" class="w-full h-full object-cover" />
              <div class="absolute bottom-2 right-2 bg-black/80 text-white px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                &#9776; ${plVideos.length}
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <h1 class="text-xl font-bold text-white leading-snug">${playlist.title}</h1>
              <div class="text-xs text-[#aaa] flex flex-col gap-1 mt-1">
                <span data-goto-ch="${playlist.channelId || ''}" class="text-white hover:underline cursor-pointer font-medium">${playlist.channelName || 'YouTube Channel'}</span>
                <span>${playlist.updatedText || 'Updated recently'}</span>
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-2">
              ${plVideos.length > 0 ? `
                <button data-vid="${plVideos[0].id}" data-ch="${plVideos[0].channelId}" data-in-playlist="true" class="w-full py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition">
                  ${ICONS.play} Play All
                </button>
              ` : ''}
              <button class="w-full py-2.5 rounded-full bg-[#272727] hover:bg-[#3f3f3f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition">
                Share Playlist
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT RAIL (VIDEOS LIST) -->
        <div class="flex-1 flex flex-col gap-3">
          <h2 class="text-lg font-bold text-white mb-2">Videos in Playlist (${plVideos.length})</h2>
          ${plVideos.map((v, idx) => `
            <div data-vid="${v.id}" data-ch="${v.channelId}" data-in-playlist="true" class="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#272727] transition cursor-pointer group border border-transparent hover:border-[#383838] ${this.watchVideo && this.watchVideo.id === v.id ? 'bg-[#272727] border-[#383838]' : ''}">
              <span class="text-sm font-mono text-[#888] w-6 text-center shrink-0 group-hover:text-white font-bold">${idx + 1}</span>
              <div class="relative w-40 sm:w-48 aspect-video rounded-xl overflow-hidden bg-[#222] shrink-0">
                <img src="${v.thumbnail}" alt="${v.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">${v.duration}</span>
              </div>
              <div class="flex flex-col gap-1 flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3ea6ff] transition">${v.title}</h3>
                <p class="text-xs text-[#aaa] truncate">${v.channelName}</p>
                <p class="text-[11px] text-[#777]">${v.views} &bull; ${v.publishedText}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
};