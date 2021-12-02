import { Injectable } from '@angular/core';

const now = new Date(2021, 10);
const end = new Date(2021, 10, 30);

@Injectable({
  providedIn: 'root',
})
export class CalculatorService {
  referentielIds: number[] = [];
  dateStart: Date = new Date(now);
  dateStop: Date = new Date(end);

  constructor() {}
}
