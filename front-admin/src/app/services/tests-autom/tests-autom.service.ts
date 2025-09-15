import { Injectable, inject } from '@angular/core';
import { ServerService } from '../http-server/server.service';

export interface TestSearchResult {
  score: number; // 0..1
  title: string;
  file: string;
  line?: number;
}

@Injectable({ providedIn: 'root' })
export class TestsAutomService {
  private server = inject(ServerService);
  // Temporary mocked dataset. Later this will call the API to run the semantic search.
  private corpus: TestSearchResult[] = [
    { score: 0.82, title: 'Simulator page loads', file: 'end-to-end/cypress/e2e/simulator.cy.js' },
    { score: 0.78, title: 'Reaffectator page loads', file: 'end-to-end/cypress/e2e/reaffectator.cy.js' },
    { score: 0.66, title: 'Panorama basic navigation', file: 'end-to-end/cypress/e2e/panorama.cy.js' },
  ];

  async search(query: string): Promise<TestSearchResult[]> {
    // Try real backend first
    try {
      const resp = await this.server.post('/admin-tests/search', { query, topK: 20 });
      const payload = resp?.data ?? resp;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return items.map((i: any) => ({ score: i.score ?? 0, title: i.title ?? i.file ?? 'Test', file: i.file ?? '', line: i.line }));
    } catch (e) {
      // Fallback to mock if backend not available
      const q = (query || '').toLowerCase();
      const results = this.corpus
        .map((r) => ({ ...r, score: this.score(q, (r.title + ' ' + r.file).toLowerCase()) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      await new Promise((res) => setTimeout(res, 200));
      return results;
    }
  }

  async reindex(): Promise<{ ok: boolean }> {
    try {
      const resp = await this.server.post('/admin-tests/reindex', {});
      const payload = resp?.data ?? resp;
      return { ok: !!payload?.ok };
    } catch {
      return { ok: false };
    }
  }

  async list(): Promise<TestSearchResult[]> {
    try {
      const resp = await this.server.get('/admin-tests/list');
      const payload = resp?.data ?? resp;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return items.map((i: any) => ({ score: 0, title: i.title ?? i.file ?? 'Test', file: i.file ?? '', line: i.line }));
    } catch {
      return [];
    }
  }

  async getSnippet(file: string, line: number): Promise<{ snippet: string; start: number; end: number; includedBefores?: number } | null> {
    try {
      const resp = await this.server.get(`/admin-tests/snippet?file=${encodeURIComponent(file)}&line=${encodeURIComponent(String(line || 1))}`);
      const payload = resp?.data ?? resp;
      if (payload?.exists) {
        return { snippet: payload.snippet ?? '', start: payload.start ?? line, end: payload.end ?? line, includedBefores: payload.includedBefores };
      }
      return null;
    } catch {
      return null;
    }
  }

  private score(q: string, text: string) {
    if (!q) return 0;
    let s = 0;
    const words = q.split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (text.includes(w)) s += 0.3;
    }
    if (text.includes(q)) s += 0.3;
    return Math.min(1, s);
  }
}
