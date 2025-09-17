import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { TestsAutomService, TestSearchResult } from '../../services/tests-autom/tests-autom.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, WrapperComponent],
  templateUrl: './tests-autom.page.html',
  styleUrls: ['./tests-autom.page.scss'],
})
export class TestsAutomPage implements OnInit {
  query = '';
  isSearching = false;
  isIndexing = false;
  hasSearched = false;
  results: TestSearchResult[] = [];
  error: string | null = null;
  snippets: Array<{ loading: boolean; content: string; start: number; end: number; summaryFr?: string | null } | null> = [];

  constructor(private testsSvc: TestsAutomService) {}

  async ngOnInit() {
    // Reindex corpus on page load to ensure a fresh, deterministic state
    this.isIndexing = true;
    try {
      await this.testsSvc.reindex();
    } catch {
      // ignore; UI will still be usable
    } finally {
      this.isIndexing = false;
    }
  }

  async onSearch() {
    if (this.isIndexing) return;
    this.error = null;
    const q = (this.query || '').trim();
    if (!q) {
      // If empty query, clear results
      this.results = [];
      this.snippets = [];
      this.hasSearched = false;
      return;
    }
    this.isSearching = true;
    this.hasSearched = true;
    try {
      const res = await this.testsSvc.search(q);
      this.results = res || [];
      this.snippets = new Array(this.results.length).fill(null);
      console.log('[Tests autom] Search results for', q, ':', this.results.length);
    } catch (e: any) {
      this.error = e?.message || 'Erreur lors de la recherche';
    } finally {
      this.isSearching = false;
    }
  }

  async onToggleSnippet(index: number) {
    const res = this.results[index];
    if (!res) return;
    if (this.snippets[index]) {
      // collapse
      this.snippets[index] = null;
      return;
    }
    // expand and fetch
    this.snippets[index] = { loading: true, content: '', start: res.line || 1, end: res.line || 1, summaryFr: null };
    const snip = await this.testsSvc.getSnippet(res.file, res.line || 1, res.source);
    if (snip) {
      this.snippets[index] = { loading: false, content: snip.snippet, start: snip.start, end: snip.end, summaryFr: snip.summaryFr };
    } else {
      this.snippets[index] = { loading: false, content: 'Snippet indisponible', start: res.line || 1, end: res.line || 1, summaryFr: null };
    }
  }
}
