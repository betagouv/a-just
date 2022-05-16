import { PipeTransform, Pipe, Injectable } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

@Injectable()
@Pipe({
  name: 'sanitizeUrl',
  pure: false, // required to update the value when the promise is resolved
})
export class SanitizeUrlPipe implements PipeTransform {
  constructor(private _sanitizer: DomSanitizer) { }

  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustUrl(v);
  }
}
