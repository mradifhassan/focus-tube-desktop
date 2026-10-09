/**
 * @file engine.js
 * Recommendations engine — builds an adjacency graph of related videos
 * from shared words in titles/descriptions and returns "Up Next" picks.
 */

export class RelatedVideosEngine {
  constructor(videos) {
    this.videos = videos || [];
    this.adjacencyList = new Map();
    this.buildGraph();
  }

  buildGraph() {
    const videos = this.videos;
    const n = videos.length;
    this.adjacencyList = new Map();
    if (n === 0) return;

    // 1. Tokenize each video once (the old code re-derived two Sets with two
    //    regex matches *per pair*, ~500k times for a 998-video channel).
    const ids = new Array(n);
    const wordSets = new Array(n);
    for (let i = 0; i < n; i++) {
      ids[i] = videos[i].id;
      this.adjacencyList.set(ids[i], new Set());
      const text = ((videos[i].title || '') + ' ' + (videos[i].description || '')).toLowerCase();
      wordSets[i] = new Set(text.match(/\b[a-z\u0980-\u09ff]{4,}\b/g) || []);
    }

    // 2. Inverted index: word -> video indices that contain it.
    const postings = new Map();
    for (let i = 0; i < n; i++) {
      wordSets[i].forEach((w) => {
        let arr = postings.get(w);
        if (arr === undefined) postings.set(w, (arr = []));
        arr.push(i);
      });
    }

    // 3. For each video, walk posting lists to find every video sharing >=1 word.
    //    Any single shared word already decides the edge, so we can stop as soon
    //    as all other videos are reached (saturation) — and we process words most
    //    shared-first so saturation happens almost immediately on real catalogs.
    const seen = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const adj = this.adjacencyList.get(ids[i]);
      const words = Array.from(wordSets[i]).sort(
        (a, b) => postings.get(b).length - postings.get(a).length
      );

      let marked = 0;
      for (let wi = 0; wi < words.length; wi++) {
        const arr = postings.get(words[wi]);
        for (let k = 0; k < arr.length; k++) {
          const j = arr[k];
          if (j !== i && !seen[j]) {
            seen[j] = 1;
            marked++;
          }
        }
        if (marked === n - 1) break;
      }

      // Insertion order matters: the old O(n^2) scan walked j ascending, and
      // getUpNext()'s BFS output depends on Set iteration order. Add edges here
      // in ascending j so each neighbour set matches the old order exactly
      // (j < i were already appended by earlier rows, also ascending).
      for (let j = i + 1; j < n; j++) {
        if (seen[j] || j === i + 1) {
          adj.add(ids[j]);
          this.adjacencyList.get(ids[j]).add(ids[i]);
        }
      }

      seen.fill(0);
    }
  }

  getUpNext(startId, maxNodes = 12) {
    if (!this.adjacencyList.has(startId)) return [];
    const visited = new Set([startId]);
    const queue = [startId];
    const result = [];

    while (queue.length > 0 && result.length < maxNodes) {
      const currentId = queue.shift();
      const videoObj = this.videos.find(v => v.id === currentId);
      if (videoObj && currentId !== startId) result.push(videoObj);

      const neighbors = this.adjacencyList.get(currentId) || new Set();
      neighbors.forEach(nId => {
        if (!visited.has(nId)) {
          visited.add(nId);
          queue.push(nId);
        }
      });
    }
    return result;
  }
}