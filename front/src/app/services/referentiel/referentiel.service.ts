import { effect, inject, Injectable, signal, untracked } from '@angular/core'
import { cloneDeep } from 'lodash'
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
   * Référentiels déjà chargés, par backup et par visibilité de page.
   * Les onglets d'une fiche s'en servent pour éviter un nouvel appel.
   */
  private referentielCache = new Map<string, ContentieuReferentielInterface[]>()
  /**
   * Demandes en cours, pour ne lancer qu'un appel par backup.
   */
  private referentielRequests = new Map<string, Promise<ContentieuReferentielInterface[]>>()

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const backupId = this.humanResourceService.backupIdS()
      // Les groupes arrivent après le premier backup : on relance pour charger l'arrondissement.
      this.humanResourceService.juridictionGroups()
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
   * Id négatif de l'arrondissement du backup. Null si on est déjà sur l'arrondissement
   * ou si la juridiction n'appartient à aucun groupe.
   */
  private arrondissementBackupId(backupId: number): number | null {
    if (backupId <= 0) return null
    const group = this.humanResourceService.juridictionGroups().find((item) => item.backups?.some((backup) => backup.id === backupId))
    return group?.id != null ? group.id * -1 : null
  }

  private loadReferentiel(backupId: number, visibleIn: ReferentielPageVisibility | null): Promise<void> {
    const arrondissementId = this.arrondissementBackupId(backupId)
    const key = `${backupId}:${arrondissementId ?? ''}:${visibleIn ?? ''}`
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

    const arrondissementRequest = arrondissementId != null ? this.onGetReferentiel(arrondissementId, visibleIn) : Promise.resolve(null)

    void Promise.all([this.onGetReferentiel(backupId || 0, visibleIn), arrondissementRequest])
      .then(([datas, arrondissementDatas]) => {
        if (generation !== this.generation) return
        const arrondissementList = arrondissementDatas?.referentielsComplete ?? datas.referentielsComplete
        this.rememberReferentiel(backupId, visibleIn, datas.referentielsComplete)
        if (arrondissementId != null) this.rememberReferentiel(arrondissementId, visibleIn, arrondissementList)
        this.formatDatas(datas.referentielsComplete, datas.referentiels)
        this.humanResourceService.contentieuxReferentielArrondissement.next(
          (arrondissementList || []).filter((referentiel: ContentieuReferentielInterface) => referentiel.label !== 'Indisponibilité'),
        )
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
   * Référentiel d'un backup (id négatif pour un arrondissement), sans les indisponibilités.
   * Retourne la copie en cache si ce backup a déjà été chargé pour la page courante.
   * @param backupId
   */
  getReferentiel(backupId: number): Promise<ContentieuReferentielInterface[]> {
    const visibleIn = untracked(() => this.pageVisibleIn())
    const key = this.cacheKey(backupId, visibleIn)
    const cached = this.referentielCache.get(key)
    if (cached) return Promise.resolve(cloneDeep(cached))

    const pending = this.referentielRequests.get(key)
    if (pending) return pending.then((list) => cloneDeep(list))

    const request = this.onGetReferentiel(backupId, visibleIn)
      .then((datas) => {
        const list = cloneDeep(this.contentieuxOnly(datas?.referentielsComplete || []))
        this.referentielCache.set(key, list)
        this.referentielRequests.delete(key)
        return list
      })
      .catch((error) => {
        this.referentielRequests.delete(key)
        throw error
      })

    this.referentielRequests.set(key, request)
    return request.then((list) => cloneDeep(list))
  }

  /**
   * Mémorise le référentiel renvoyé au chargement de la page.
   * @param backupId
   * @param visibleIn
   * @param list
   */
  private rememberReferentiel(
    backupId: number,
    visibleIn: ReferentielPageVisibility | null,
    list: ContentieuReferentielInterface[] | null | undefined,
  ) {
    this.referentielCache.set(this.cacheKey(backupId, visibleIn), cloneDeep(this.contentieuxOnly(list || [])))
  }

  /**
   * Clé de cache : backup et visibilité de la page.
   * @param backupId
   * @param visibleIn
   */
  private cacheKey(backupId: number, visibleIn: ReferentielPageVisibility | null) {
    return `${backupId}:${visibleIn ?? ''}`
  }

  /**
   * Retire les indisponibilités, comme le référentiel affiché dans les ventilations.
   * @param list
   */
  private contentieuxOnly(list: ContentieuReferentielInterface[]) {
    const indispo = list.find((item) => item.label === 'Indisponibilité')
    const excluded = new Set<number>()
    if (indispo) {
      excluded.add(indispo.id)
      for (const child of indispo.childrens || []) excluded.add(child.id)
    }
    return list.filter((item) => !excluded.has(item.id))
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
