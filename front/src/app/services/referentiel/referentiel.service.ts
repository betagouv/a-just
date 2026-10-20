import { effect, inject, Injectable, signal, untracked } from '@angular/core'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { ServerService } from '../http-server/server.service'

/**
 * Contexte de visibilité porté par une page.
 * null sur les autres pages : le référentiel n'est pas filtré.
 */
export type ReferentielPageVisibility = 'extractor' | 'cockpit' | 'activity'

/**
 * Service de centralisation des traitements lié au référentiel
 */
@Injectable({
  providedIn: 'root',
})
export class ReferentielService {
  serverService = inject(ServerService)
  humanResourceService = inject(HumanResourceService)
  referentielIsComplete = signal<boolean>(true)
  /**
   * Ids du référentiels des indispo
   */
  idsIndispo: number[] = []
  /**
   * Id du référentiels niveau 3 des indispo
   */
  idsMainIndispo: number = 0
  /**
   * Ids des contentieux de type soutien et ses enfants
   */
  idsSoutien: number[] = []
  /**
   * Ids des contentieux niveau 3
   */
  mainActivitiesId: number[] = []
  /**
   * Visibilité demandée par la page courante.
   */
  private pageVisibleIn = signal<ReferentielPageVisibility | null>(null)
  /**
   * Identifiant de la dernière demande. Une réponse plus ancienne est ignorée.
   */
  private generation = 0
  /**
   * Promesse partagée : elle ne se résout qu'avec la dernière demande.
   */
  private pending: Promise<void> | null = null
  private resolvePending: (() => void) | null = null
  /**
   * Clé (juridiction + page) de la demande en cours
   */
  private pendingKey: string | null = null
  /**
   * Clé (juridiction + page) du référentiel déjà appliqué
   */
  private appliedKey: string | null = null

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const backupId = this.humanResourceService.backupIdS()
      const visibleIn = untracked(() => this.pageVisibleIn())
      if (backupId != null) {
        void this.loadReferentiel(backupId, visibleIn)
      }
    })
  }

  /**
   * Visibilité à demander pour une url.
   * L'extracteur, le cockpit et les données d'activité ont chacun leur filtre.
   * @param url
   */
  visibleInForUrl(url: string): ReferentielPageVisibility | null {
    const path = url.split(/[?#]/)[0]
    if (path === '/dashboard' || path.startsWith('/dashboard/')) return 'extractor'
    if (path === '/cockpit' || path.startsWith('/cockpit/')) return 'cockpit'
    if (path === '/donnees-d-activite' || path.startsWith('/donnees-d-activite/')) return 'activity'
    return null
  }

  /**
   * Charge le référentiel de la page cible.
   * La promesse ne se résout qu'une fois la demande de cette page terminée.
   * Si la page change pendant le chargement, la réponse précédente est écartée
   * et l'appelant attend la nouvelle demande.
   * @param url
   */
  ensureForUrl(url: string): Promise<void> {
    const visibleIn = this.visibleInForUrl(url)
    this.pageVisibleIn.set(visibleIn)
    const backupId = this.humanResourceService.backupId.getValue()
    if (backupId == null) return Promise.resolve()
    return this.loadReferentiel(backupId, visibleIn)
  }

  /**
   * Récupération du référentiel en fonction de l'id du backup et de la page.
   * @param backupId
   * @param visibleIn
   */
  private loadReferentiel(backupId: number, visibleIn: ReferentielPageVisibility | null): Promise<void> {
    const key = `${backupId}:${visibleIn ?? ''}`
    if (this.pending && this.pendingKey === key) return this.pending
    if (this.appliedKey === key) {
      this.generation++
      this.pendingKey = null
      this.finishPending()
      return Promise.resolve()
    }

    const generation = ++this.generation
    this.pendingKey = key
    if (!this.pending) {
      this.pending = new Promise((resolve) => {
        this.resolvePending = resolve
      })
    }

    void this.onGetReferentiel(backupId || 0, visibleIn)
      .then((datas) => {
        if (generation !== this.generation) return
        this.formatDatas(datas.referentielsComplete, datas.referentiels)
        this.referentielIsComplete.set(datas.isComplete)
        this.appliedKey = key
        this.pendingKey = null
        this.finishPending()
      })
      .catch(() => {
        if (generation !== this.generation) return
        this.pendingKey = null
        this.finishPending()
      })

    return this.pending
  }

  /**
   * Débloque les appelants en attente. Sans effet s'il n'y a pas de demande en cours.
   */
  private finishPending() {
    const resolve = this.resolvePending
    this.pending = null
    this.resolvePending = null
    resolve?.()
  }

  /**
   * Récupération des informations de type référentiel et prétraitement pour gagner du temps dans les scripts
   * @param list
   */
  formatDatas(list: ContentieuReferentielInterface[], filteredList: ContentieuReferentielInterface[]) {
    const refIndispo = list.find((r) => r.label === 'Indisponibilité')
    const idsIndispo: number[] = []
    this.humanResourceService.allIndisponibilityReferentiel = []
    if (refIndispo) {
      this.idsMainIndispo = refIndispo.id
      this.humanResourceService.allIndisponibilityReferentiel.push(refIndispo)
      idsIndispo.push(refIndispo.id)
      ;(refIndispo.childrens || []).map((c) => {
        idsIndispo.push(c.id)
        this.humanResourceService.allIndisponibilityReferentiel.push(c)
      })
    }
    this.humanResourceService.allIndisponibilityReferentielIds = this.humanResourceService.allIndisponibilityReferentiel.map(function (obj) {
      return obj.id
    })

    this.idsIndispo = idsIndispo

    const refSoutien = list.find((r) => r.label === 'Autres activités')
    const idsSoutien: number[] = []
    if (refSoutien) {
      idsSoutien.push(refSoutien.id)
      ;(refSoutien.childrens || []).map((c) => {
        idsSoutien.push(c.id)
      })
    }
    this.idsSoutien = idsSoutien

    this.mainActivitiesId = list.map((r) => r.id)

    this.humanResourceService.selectedReferentielIds = list
      .filter((r) => r.label !== 'Indisponibilité')
      .filter((a) => idsIndispo.indexOf(a.id) === -1)
      .map((r) => r.id)

    this.humanResourceService.mainContentieuxReferentiel.set(
      list
        .filter((r) => r.label !== 'Indisponibilité')
        .filter((a) => idsIndispo.indexOf(a.id) === -1)
        .filter((a) => idsSoutien.indexOf(a.id) === -1),
    )

    this.humanResourceService.mainContentieuxReferentielFiltered.set(
      filteredList
        .filter((r) => r.label !== 'Indisponibilité')
        .filter((a) => idsIndispo.indexOf(a.id) === -1)
        .filter((a) => idsSoutien.indexOf(a.id) === -1),
    )

    this.humanResourceService.contentieuxReferentiel.next(list)
    this.humanResourceService.contentieuxReferentielOnly.next(list.filter((r) => idsIndispo.indexOf(r.id) === -1))
    this.humanResourceService.contentieuxReferentielOnlyFiltered.next(filteredList.filter((r) => idsIndispo.indexOf(r.id) === -1))
  }

  /**
   * Check if referentiels as "droit local"
   */
  isDroitLocal() {
    const ref = this.humanResourceService.contentieuxReferentiel.getValue()
    return ref.find((r) => r.code_import === '13.') ? true : false
  }

  /**
   * API Appel au serveur retourner une référentiel spécifique
   * @param backupId
   * @param visibleIn contexte de la page, omis pour récupérer tout le référentiel
   * @returns
   */
  async onGetReferentiel(backupId: number, visibleIn: ReferentielPageVisibility | null = null) {
    return this.serverService
      .post(`contentieux-referentiels/get-referentiels`, {
        backupId,
        ...(visibleIn ? { visibleIn } : {}),
      })
      .then((data) => {
        return data.data
      })
  }
}
