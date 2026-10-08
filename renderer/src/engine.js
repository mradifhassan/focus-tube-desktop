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
    this.videos.forEach(v => {
      this.adjacencyList.set(v.id, new Set());
    });

    for (let i = 0; i < this.videos.length; i++) {
      for (let j = i + 1; j < this.videos.length; j++) {
        const v1 = this.videos[i];
        const v2 = this.videos[j];
        const text1 = (v1.title + ' ' + (v1.description || '')).toLowerCase();
        const text2 = (v2.title + ' ' + (v2.description || '')).toLowerCase();
        const words1 = new Set(text1.match(/\b[a-z\u0980-\u09ff]{4,}\b/g) || []);
        const words2 = new Set(text2.match(/\b[a-z\u0980-\u09ff]{4,}\b/g) || []);

        let overlap = 0;
        words1.forEach(w => {
          if (words2.has(w)) overlap++;
        });

        if (overlap >= 1 || j === i + 1) {
          this.adjacencyList.get(v1.id).add(v2.id);
          this.adjacencyList.get(v2.id).add(v1.id);
        }
      }
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