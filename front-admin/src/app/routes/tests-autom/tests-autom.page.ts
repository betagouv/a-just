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
  results: TestSearchResult[] = [];
  error: string | null = null;

  constructor(private testsSvc: TestsAutomService) {}

  async ngOnInit() {
    // Always reindex on page load to keep corpus fresh
    try {
      await this.testsSvc.reindex();
    } catch {}
  }

  async onSearch() {
    this.error = null;
    const q = (this.query || '').trim();
    if (!q) {
      // If empty query, clear results
      this.results = [];
      return;
    }
    this.isSearching = true;
    try {
      this.results = await this.testsSvc.search(q);
      console.log('[Tests autom] Search results for', q, ':', this.results.length);
    } catch (e: any) {
      this.error = e?.message || 'Erreur lors de la recherche';
    } finally {
      this.isSearching = false;
    }
  }
}
