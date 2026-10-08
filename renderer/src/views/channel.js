/**
 * @file views/channel.js
 * Channel page — banner, header, tabs (Videos | Playlists | About).
 */

import { ICONS } from '../icons.js';

export const channelViewMixin = {
  renderChannelPageHtml(channel) {
    const catalog = this.dataCache[channel.id] || { videos: [], playlists: [] };
    const vids = catalog.videos || [];
    const pls = catalog.playlists || [];

    return `
      <div class="flex flex-col pb-12">
        <!-- CHANNEL BANNER -->
        <div class="w-full h-32 sm:h-52 bg-gradient-to-r from-red-900/40 via-zinc-800 to-black relative">
          <div class="absolute inset-0 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        </div>

        <!-- CHANNEL HEADER -->
        <div class="px-6 lg:px-16 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#272727]">
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full ${channel.avatarColor || 'bg-red-600'} text-white font-black text-3xl flex items-center justify-center shadow-xl shrink-0 border-2 border-[#272727]">
              ${channel.initials || 'CH'}
            </div>
            <div class="flex flex-col gap-1">
              <h1 class="text-2xl font-bold text-white">${channel.name}</h1>
              <p class="text-xs text-[#aaa]">${channel.handle || '@channel'} &bull; ${channel.subscriberCount || 'Subscribed'} &bull; ${vids.length} videos</p>
              <p class="text-xs text-[#aaa] line-clamp-1 max-w-2xl mt-1">${channel.description || 'Welcome to official channel broadcast.'}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="bg-[#f1f1f1] hover:bg-white text-black font-semibold text-sm px-6 py-2.5 rounded-full shadow">
              Subscribed &#10003;
            </button>
            <button data-del-ch="${channel.id}" class="p-2.5 rounded-full bg-[#272727] hover:bg-red-600 hover:text-white text-[#aaa] transition" title="Unsubscribe Channel">
              ${ICONS.trash}
            </button>
          </div>
        </div>

        <!-- CHANNEL TABS -->
        <div class="px-6 lg:px-16 flex items-center border-b border-[#272727] bg-[#0f0f0f]">
          <div data-ch-tab="videos" class="yt-tab ${this.channelTab === 'videos' ? 'active' : ''}">Videos (${vids.length})</div>
          <div data-ch-tab="playlists" class="yt-tab ${this.channelTab === 'playlists' ? 'active' : ''}">Playlists (${pls.length})</div>
          <div data-ch-tab="about" class="yt-tab ${this.channelTab === 'about' ? 'active' : ''}">About Channel</div>
        </div>

        <!-- TAB BODY CONTENT -->
        <div class="p-6 lg:px-16 pt-8">
          ${this.channelTab === 'videos' ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-8">
              ${vids.map(v => `
                <div data-vid="${v.id}" data-ch="${channel.id}" class="yt-video-card flex flex-col gap-2.5 group">
                  <div class="relative aspect-video rounded-xl overflow-hidden bg-[#222]">
                    <img src="${v.thumbnail}" alt="${v.title}" class="yt-thumb-img w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <span class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono">${v.duration}</span>
                  </div>
                  <h3 class="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3ea6ff]">${v.title}</h3>
                  <p class="text-xs text-[#aaa]">${v.views} &bull; ${v.publishedText}</p>
                </div>
              `).join('')}
            </div>
          ` : this.channelTab === 'playlists' ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${pls.map(pl => `
                <div data-pl="${pl.id}" class="bg-[#1f1f1f] rounded-2xl overflow-hidden hover:bg-[#272727] transition cursor-pointer flex flex-col group border border-[#272727]">
                  <div class="relative aspect-video bg-[#111]">
                    <img src="${pl.thumbnail}" alt="${pl.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span class="text-white font-bold text-sm flex items-center gap-1.5 bg-red-600 px-4 py-2 rounded-full shadow">${ICONS.play} View Playlist</span>
                    </div>
                    <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono font-bold">
                      &#9776; ${pl.videoCount || (pl.videos ? pl.videos.length : 0)}
                    </span>
                  </div>
                  <div class="p-4">
                    <h4 class="text-sm font-bold text-white truncate group-hover:text-[#3ea6ff]">${pl.title}</h4>
                    <p class="text-xs text-[#aaa] mt-1">${pl.updatedText || 'Recently updated'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="bg-[#1f1f1f] p-6 rounded-2xl max-w-3xl flex flex-col gap-4 border border-[#272727]">
              <h3 class="text-base font-bold text-white">Channel Description</h3>
              <p class="text-sm text-[#ddd] leading-relaxed whitespace-pre-line">${channel.description}</p>
              <div class="border-t border-[#272727] pt-4 flex flex-col gap-2 text-xs text-[#aaa]">
                <p>Channel ID: ${channel.id}</p>
                <p>Subscribers: ${channel.subscriberCount || 'Subscribed'}</p>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  },
};