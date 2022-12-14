import { PipeTransform, Pipe, Injectable } from '@angular/core'
import { DomSanitizer, SafeStyle } from '@angular/platform-browser'

/**
 * Force to parse le style
 */

@Injectable()
@Pipe({
  name: 'sanitizeStyle',
  pure: false, // required to update the value when the promise is resolved
})
export class SanitizeStylePipe implements PipeTransform {
  /**
   * Constructeur
   * @param _sanitizer
   */
  constructor(private _sanitizer: DomSanitizer) {}

  /**
   * Analyse la chaine
   * @param v
   * @returns
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustStyle(v)
  }
}
