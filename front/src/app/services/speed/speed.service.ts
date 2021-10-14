import { Injectable } from '@angular/core';
import { AmplitudeInterface } from 'src/app/interfaces/amplitude-interface';
import { SpeedInterface } from 'src/app/interfaces/speed-interface';
import { getRandomInt } from 'src/app/utils/numbers';

@Injectable({
  providedIn: 'root',
})
export class SpeedService {
  constructor() {}

  getSpeedValues(speedLevel: number): Promise<SpeedInterface[]> {
    // simulate API

    return new Promise((revole) => {
      const list = [];

      for (let i = 0; i < 10; i++) {
        list.push({
          x: i + getRandomInt(speedLevel),
          y: i + getRandomInt(speedLevel),
          r: i + getRandomInt(speedLevel),
        });
      }

      revole(list);
    });
  }

  getAmplitudeValues(
    speedLevel: number,
    amplitude: number
  ): Promise<AmplitudeInterface> {
    // simulate API

    return new Promise((revole) => {
      const datas: number[] = [];
      const labels = ['Petite', 'Un peu plus', 'Encore un peu', 'Moyennement', 'Belle', 'Beaucoup', 'Beaucoup trop !'];

      for (let i = 0; i < 10; i++) {
        datas.push(i + getRandomInt(speedLevel + amplitude));
      }

      revole({ datas, labels });
    });
  }
}
