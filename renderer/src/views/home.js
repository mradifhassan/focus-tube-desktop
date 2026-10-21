/**
 * @file views/home.js
 * Home / feed page — category filter chips + video grid. The "playlists"
 * filter delegates to the library view.
 */

export const homeViewMixin = {
  renderHomePageHtml() {
    return `
      <!-- TOP CATEGORY FILTER PILLS -->
      <div class="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur px-3 sm:px-6 py-3 flex items-center gap-3 border-b border-[#272727] overflow-x-auto">
        <button data-filter="all" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'all' ? 'active' : ''}">All</button>
        <button data-filter="playlists" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'playlists' ? 'active' : ''}">Playlists</button>
        <button data-filter="science" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'science' ? 'active' : ''}">Science & Physics</button>
        <button data-filter="tech" class="yt-chip px-4 py-1.5 rounded-lg text-sm shrink-0 ${this.feedFilter === 'tech' ? 'active' : ''}">Technology & Math</button>
      </div>

      <!-- VIDEO FEED GRID (incremental / infinite scroll) -->
      ${this.pagedVideoGridHtml(() => {
        let videos = this.getAllCachedVideos();
        if (this.feedFilter === 'science') {
          videos = videos.filter(v => this.classifyVideoSubject(v) === 'science');
        } else if (this.feedFilter === 'tech') {
          videos = videos.filter(v => {
            const cat = this.classifyVideoSubject(v);
            return cat === 'math' || cat === 'other';
          });
        }
        return videos;
      })}
    `;
  },
};