import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MainClass } from '../../libs/main-class';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { FeedbackService } from '../../services/feedback/feedback.service';
import {
  FeedbackInterface,
  FeedbackStatsInterface,
} from '../../interfaces/feedback';

@Component({
  standalone: true,
  imports: [CommonModule, MatTableModule, WrapperComponent],
  templateUrl: './avis.page.html',
  styleUrls: ['./avis.page.scss'],
})
export class AvisPage extends MainClass implements OnInit, OnDestroy {
  feedbackService = inject(FeedbackService);
  displayedColumns: string[] = [
    'createdAt',
    'user',
    'rating',
    'comment',
    'recontact',
    'page',
  ];
  dataSource = new MatTableDataSource<FeedbackInterface>();
  stats: FeedbackStatsInterface | null = null;
  ratingLevels = [5, 4, 3, 2, 1];

  ngOnInit() {
    this.onLoad();
  }

  ngOnDestroy() {}

  onLoad() {
    Promise.all([
      this.feedbackService.getAll(),
      this.feedbackService.getStats(),
    ]).then(([list, stats]) => {
      this.dataSource.data = list;
      this.stats = stats;
    });
  }

  getUserLabel(feedback: FeedbackInterface): string {
    const name = [feedback.user.firstName, feedback.user.lastName]
      .filter(Boolean)
      .join(' ');

    if (name) {
      return `${name} - ${feedback.user.email}`;
    }

    return feedback.user.email;
  }

  getRatingPercent(rating: number): number {
    if (!this.stats || !this.stats.total) {
      return 0;
    }

    return Math.round(
      ((this.stats.byRating[rating] || 0) / this.stats.total) * 100,
    );
  }
}
