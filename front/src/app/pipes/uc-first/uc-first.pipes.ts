import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ucFirst' })
export class UcFirstPipe implements PipeTransform {
  transform(string: string) {
    if (string && typeof string === 'string') {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return string;
  }
}
