import { PipeTransform, Pipe, inject } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'

const ALLOWED_IFRAME_HOSTS = ['docs.a-just.beta.gouv.fr', 'meta.a-just.beta.gouv.fr']

/**
 * Valide et sanitize une URL de ressource pour iframe.
 * Seules les URLs HTTPS provenant des domaines autorisés sont acceptées.
 */
@Pipe({
  standalone: true,
  name: 'sanitizeResourceUrl',
})
export class SanitizeResourceUrlPipe implements PipeTransform {
  _sanitizer = inject(DomSanitizer)

  /**
   * Valide l'URL et retourne une SafeResourceUrl si elle est autorisée, sinon une chaîne vide.
   * @param v
   * @returns
   */
  transform(v: string): SafeResourceUrl {
    if (!v) {
      return this._sanitizer.bypassSecurityTrustResourceUrl('')
    }
    try {
      const url = new URL(v)
      if (url.protocol !== 'https:' || !ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
        console.warn(`[sanitizeResourceUrl] URL non autorisée bloquée : ${v}`)
        return this._sanitizer.bypassSecurityTrustResourceUrl('')
      }
      return this._sanitizer.bypassSecurityTrustResourceUrl(v)
    } catch {
      console.warn(`[sanitizeResourceUrl] URL invalide bloquée : ${v}`)
      return this._sanitizer.bypassSecurityTrustResourceUrl('')
    }
  }
}
