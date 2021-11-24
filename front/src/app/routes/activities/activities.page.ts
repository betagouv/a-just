import { Component } from '@angular/core';
import { ActivitiesService } from 'src/app/services/activities/activities.service';

@Component({
  templateUrl: './activities.page.html',
  styleUrls: ['./activities.page.scss'],
})
export class ActivitiesPage {
  constructor(private activitiesService: ActivitiesService) {}
}
