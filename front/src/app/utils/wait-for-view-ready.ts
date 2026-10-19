import { ApplicationRef } from '@angular/core'
import { filter, firstValueFrom, take } from 'rxjs'

/**
 * Attend la fin du cycle Angular et le prochain repaint (layout appliqué).
 * Utile avant html2canvas ou toute capture DOM.
 */
export async function waitForViewReady(appRef: ApplicationRef): Promise<void> {
  appRef.tick()
  await firstValueFrom(appRef.isStable.pipe(filter((stable) => stable), take(1)))
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
