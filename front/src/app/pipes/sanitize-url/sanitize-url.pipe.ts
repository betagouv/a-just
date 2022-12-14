import { PipeTransform, Pipe, Injectable } from '@angular/core'
import { DomSanitizer, SafeStyle } from '@angular/platform-browser'

/**
 * Force to parse un url
 */

@Injectable()
@Pipe({
  name: 'sanitizeUrl',
  pure: false, // required to update the value when the promise is resolved
})
export class SanitizeUrlPipe implements PipeTransform {
  /**
   * constructeur
   * @param _sanitizer
   */
  constructor(private _sanitizer: DomSanitizer) {}

  /**
   * Analyse la chaine
   * @param v
   * @returns
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustUrl(v)
  }
}
