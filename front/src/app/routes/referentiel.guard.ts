import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { ReferentielService } from '../services/referentiel/referentiel.service'

/**
 * Charge le référentiel filtré pour la page cible
 * et bloque l'activation tant que cette demande n'est pas terminée.
 * Une page suivante annule la demande encore en cours.
 */
export const referentielGuard: CanActivateFn = (_route, state) => {
  return inject(ReferentielService)
    .ensureForUrl(state.url)
    .then(() => true)
}
