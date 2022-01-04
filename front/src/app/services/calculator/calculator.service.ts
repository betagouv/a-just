import { Injectable } from '@angular/core';

const now = new Date(2021, 0);
const end = new Date(2021, 11, 30);

@Injectable({
  providedIn: 'root',
})
export class CalculatorService {
  referentielIds: number[] = [];
  dateStart: Date = new Date(now);
  dateStop: Date = new Date(end);

  constructor() {}
}
