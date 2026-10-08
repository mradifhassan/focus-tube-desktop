/**
 * @file views/home.js
 * Home / feed page — category filter chips + video grid. The "playlists"
 * filter delegates to the library view.
 */

export const homeViewMixin = {
  renderHomePageHtml() {
    let videos = this.getAllCachedVideos();

    if (this.feedFilter === 'playlists') {
      return this.renderLibraryPageHtml();
    } else if (this.feedFilter === 'science') {
      videos = videos.filter(v => v.title.includes('বিজ্ঞান') || v.title.toLowerCase().includes('physics') || v.title.toLowerCase().includes('science'));
    } else if (this.feedFilter === 'tech') {
      videos = videos.filter(v => v.title.toLowerCase().includes('tech') || v.channelName.toLowerCase().includes('tech') || v.title.includes('কোড') || v.title.includes('রসায়ন') || v.title.includes('ক্যালকুলাস'));
    }

    return `
      <!-- TOP CATEGORY FILTER PILLS -->
      <div class="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur px-6 py-3 flex items-center gap-3 border-b border-[#272727] overflow-x-auto">
        <button data-filter="all" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'all' ? 'active' : ''}">All</button>
        <button data-filter="playlists" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'playlists' ? 'active' : ''}">Playlists</button>
        <button data-filter="science" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'science' ? 'active' : ''}">Science & Physics</button>
        <button data-filter="tech" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'tech' ? 'active' : ''}">Technology & Math</button>
        <button data-filter="recently" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'recently' ? 'active' : ''}">Recently Uploaded</button>
      </div>

      <!-- VIDEO FEED GRID -->
      <div class="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        ${videos.map(v => `
          <div data-vid="${v.id}" data-ch="${v.channelId}" class="yt-video-card flex flex-col gap-3 group">
            <!-- THUMBNAIL -->
            <div class="relative aspect-video w-full rounded-xl overflow-hidden bg-[#222222]">
              <img src="${v.thumbnail}" alt="${v.title}" class="yt-thumb-img w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <span class="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium font-mono tracking-tight">
                ${v.duration}
              </span>
            </div>

            <!-- META INFO -->
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
    `;
  },
};