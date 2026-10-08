/**
 * @file views/isolated.js
 * Isolated single-video view (hash route #/v/VIDEO_ID) — player + title +
 * duration + description only, no feed and no recommendations.
 */

export const isolatedViewMixin = {
  renderIsolatedMetaHtml(vid) {
    return `
      <h1 class="text-lg font-bold text-white leading-snug">${this.escapeHtml(vid.title)}</h1>
      <p class="text-xs text-[#aaa] mt-1 font-mono">${this.escapeHtml(vid.duration)}</p>
      <p class="text-xs text-[#ddd] whitespace-pre-line leading-relaxed mt-3">${this.escapeHtml(vid.description)}</p>
    `;
  },

  renderIsolatedPage() {
    const id = this.isolatedVideoId;
    const vid = this.isolatedVideoData;
    const host = this.privacyShield ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';

    this.root.innerHTML = `
      <div class="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex items-start justify-center p-4 sm:p-10 font-sans select-none">
        <div class="max-w-3xl w-full flex flex-col gap-4">

          <div class="flex items-center justify-between">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-[#272727] text-[#aaa]">Isolated Video &bull; No Suggestions</span>
            <a href="${window.location.pathname}" class="text-xs text-[#3ea6ff] hover:underline">Exit to FocusTube</a>
          </div>

          <div class="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#272727]">
            <iframe
              src="${host}/embed/${id}?rel=0&modestbranding=1"
              title="${vid ? this.escapeHtml(vid.title) : 'Video player'}"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>

          <div id="isolated-embed-fallback" class="hidden bg-[#1f1f1f] border border-[#3f3f3f] rounded-xl p-4 text-sm text-[#ddd] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>This video's owner has disabled embedding, so it can't play here.</span>
            <a href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" class="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-white font-bold text-xs">Watch on YouTube</a>
          </div>

          <div id="isolated-meta">
            ${vid ? this.renderIsolatedMetaHtml(vid) : `<div class="animate-pulse text-sm text-[#aaa]">Fetching title, duration &amp; description&hellip;</div>`}
          </div>
        </div>
      </div>
    `;

    if (!vid) {
      this.fetchIsolatedVideoMeta(id);
    }
    this.checkEmbeddable(id, 'isolated-embed-fallback');
  },
};