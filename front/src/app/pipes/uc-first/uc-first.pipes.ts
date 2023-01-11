import { Pipe, PipeTransform } from '@angular/core'

/**
 * Transforme une string en premier caratère en majuscule et le reste en minuscule
 */
@Pipe({ name: 'ucFirst' })
export class UcFirstPipe implements PipeTransform {
  /**
   * Analyse la chaine
   * @param v
   * @returns
   */

  transform(string: string) {
    if (string && typeof string === 'string') {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
    return string
  }
}
