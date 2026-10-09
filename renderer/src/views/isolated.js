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

    // Keep any already-hydrated player alive across the metadata re-render below.
    const existing = document.querySelector('#isolated-player-shell iframe');

    this.root.innerHTML = `
      <div class="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex items-start justify-center p-4 sm:p-10 font-sans select-none">
        <div class="max-w-3xl w-full flex flex-col gap-4">

          <div class="flex items-center justify-between">
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-[#272727] text-[#aaa]">Isolated Video &bull; No Suggestions</span>
            <a href="${window.location.pathname}" class="text-xs text-[#3ea6ff] hover:underline">Exit to FocusTube</a>
          </div>

          <!-- FACADE: the YouTube embed is only created on click (façade pattern) --
               zero YouTube scripts until the user presses play. -->
          <div id="isolated-player-shell" class="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#272727]">
            ${existing
              ? ''
              : `
                <div id="isolated-player-facade" data-facade-vid="${id}" class="absolute inset-0 cursor-pointer group" role="button" aria-label="Play video">
                  <img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="Video thumbnail" decoding="async" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" />
                  <div class="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition flex items-center justify-center">
                    <span class="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-105 transition">
                      <svg class="w-9 h-9 ml-1 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </span>
                  </div>
                </div>
              `}
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

    // Re-attach the live player if it was hydrated before this re-render.
    if (existing) {
      const shell = document.getElementById('isolated-player-shell');
      if (shell) shell.replaceChildren(existing);
    }

    this.wireFacadeEvents('isolated-player-facade', this.hydrateIsolatedFacade);

    if (!vid) {
      this.fetchIsolatedVideoMeta(id);
    }
    this.checkEmbeddable(id, 'isolated-embed-fallback');
  },
};