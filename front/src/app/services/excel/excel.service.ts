import { Injectable } from '@angular/core'
import * as Sentry from '@sentry/browser'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { BehaviorSubject } from 'rxjs'
import { UserService } from '../user/user.service'
import * as FileSaver from 'file-saver'
import { ServerService } from '../http-server/server.service'
import { AppService } from '../app/app.service'
import { Renderer } from 'xlsx-renderer'
import { MainClass } from '../../libs/main-class'
import { HRCategoryInterface } from '../../interfaces/hr-category'
import { HRFonctionInterface } from '../../interfaces/hr-fonction'
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel'
import { setTimeToMidDay } from '../../utils/dates'
import { exposeDownloadToCypress, getE2EExportMaxMs } from '../../utils/test-download'
import { IMPORT_ETP_TEMPLATE } from '../../constants/documentation'

/**
 * Excel file details
 */
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'

/**
 * Service d'extraction excel
 */
@Injectable({
  providedIn: 'root',
})
export class ExcelService extends MainClass {
  /**
   * Categories selectionnées par l'utilisateur
   */
  categories: HRCategoryInterface[] = []
  /**
   * Fonctions selectionnées par l'utilisateur
   */
  fonctions: HRFonctionInterface[] = []
  /**
   * Liste des referentiels
   */
  allReferentiels: ContentieuReferentielInterface[] = []
  /**
   * Date de début d'extraction
   */
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  /**
   * Date de fin d'extraction
   */
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date())
  /**
   * Catégories à extraire
   */
  selectedCategory: BehaviorSubject<Array<string>> = new BehaviorSubject<Array<string>>(new Array())
  /**
   * En cours de chargement
   */
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  /**
   * Données d'extraction
   */
  data: Array<any> = []
  /**
   * Taille des colonnes dans l'onglet 1 du fichier excel extrait
   */
  columnSize: Array<any> = []
  /**
   * Taille des colonnes dans l'longlet 2 fichier excel extrait
   */
  columnSizeSecondTab: Array<any> = []

  tabs: any = {
    onglet1: { values: null, columnSize: null },
    onglet2: { values: null, columnSize: null },
  }

  /**
   * Sentry instrumentation for Excel export
   */
  private _excelTxn: any | undefined
  private _excelStartAt: number | undefined
  private _excelLabel: string | undefined
  private _excelSpan: any | undefined
  private _excelDefer: { resolve?: () => void } = {}

  private _startExcelTxn(label: string) {
    // Close any dangling transaction
    try {
      if (this._excelTxn && this._excelStartAt) {
        const ms = Math.max(0, performance.now() - this._excelStartAt)
        try {
          ;(this._excelTxn as any)?.setAttribute?.('latency_ms', ms as any)
        } catch {}
        try {
          ;(this._excelTxn as any)?.finish?.()
        } catch {}
      }
    } catch {}
    this._excelLabel = label
    this._excelStartAt = performance.now()
    // Prefer a manual transaction to guarantee duration = finish - start
    try {
      const tx: any = (Sentry as any).startTransaction
        ? (Sentry as any).startTransaction({ name: 'extracteur: export excel (effectifs)', op: 'task', forceTransaction: true })
        : null
      this._excelTxn = tx || this._excelTxn
      // Make this transaction current so breadcrumbs/spans attach under it
      try {
        ;(Sentry as any).getCurrentHub?.().configureScope?.((scope: any) => scope.setSpan?.(tx))
      } catch {}
      this._excelSpan = tx || this._excelSpan
      try {
        this._excelSpan?.setAttribute?.('sentry.tag.latency_event', label)
      } catch {}
    } catch {}
    // Fallback: if manual transaction is not available, keep previous deferred model
    if (!this._excelTxn) {
      const promise = new Promise<void>((resolve) => {
        this._excelDefer.resolve = resolve
      })
      Sentry.startSpan(
        { name: 'extracteur: export excel (effectifs)', op: 'task', forceTransaction: true, attributes: { 'sentry.tag.latency_event': label } },
        async () => {
          try {
            this._excelSpan = Sentry.getActiveSpan()
          } catch {}
          try {
            this._excelSpan?.setAttribute?.('sentry.tag.latency_event', label)
          } catch {}
          await promise
        },
      )
    }
    // Emit a scoped start message for discoverability
    try {
      Sentry.withScope((scope) => {
        try {
          scope.setTag('latency_event', label)
          scope.setExtra('latency_event', label)
          scope.setFingerprint(['extracteur-excel-effectifs-start', String(Date.now())])
        } catch {}
        Sentry.captureMessage('extracteur: export excel started', 'info')
      })
    } catch {}
  }

  private _finishExcelTxn(result: 'success' | 'timeout' | 'error') {
    if (this._excelStartAt) {
      try {
        const ms = Math.max(0, performance.now() - this._excelStartAt)
        this._excelSpan?.setAttribute?.('latency_ms', ms as any)
        this._excelSpan?.setAttribute?.('result', result)
        ;(this._excelTxn as any)?.setAttribute?.('latency_ms', ms as any)
        ;(this._excelTxn as any)?.setAttribute?.('result', result)
      } catch {}
      try {
        this._excelTxn?.finish?.()
      } catch {}
      try {
        this._excelDefer.resolve && this._excelDefer.resolve()
      } catch {}
    }
    this._excelTxn = undefined
    this._excelStartAt = undefined
    this._excelLabel = undefined
    this._excelSpan = undefined
  }

  // Affiche un message d'erreur spécifique si pas de valeurs, sinon message générique
  private showExtractionError(err: any) {
    const msg = 'Aucunes données à exporter pour les critères sélectionnés'
    console.error('[extractor] error', err)
    const isNoValues = err && ((err.message && err.message === msg) || err === msg)
    alert(isNoValues ? msg : 'Erreur génération fichier')
  }

  /**
   * Constructeur
   * @param humanResourceService
   * @param serverService
   * @param userService
   * @param appService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private serverService: ServerService,
    private userService: UserService,
    private appService: AppService,
  ) {
    super()
  }

  /**
   * Tester différence de valeur entre deux objets
   * @param obj1
   * @param obj2
   * @param path
   * @returns
   */
  deepDiff(obj1: any, obj2: any, path = ''): any {
    const changes = []

    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key

      if (!(key in obj2)) {
        changes.push(`🟥 Clé manquante dans obj2: ${currentPath}`)
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        changes.push(...this.deepDiff(obj1[key], obj2[key], currentPath))
      } else if (obj1[key] !== obj2[key]) {
        changes.push(`🟨 Différence à ${currentPath}: ${obj1[key]} !== ${obj2[key]}`)
      }
    }

    for (const key in obj2) {
      const currentPath = path ? `${path}.${key}` : key
      if (!(key in obj1)) {
        changes.push(`🟥 Clé manquante dans obj1: ${currentPath}`)
      }
    }

    return changes
  }

  /**
   * Extraction DDG
   * @returns
   */
  exportExcel() {
    const startTime = performance.now()
    // Start Sentry transaction for Excel export
    const label = "Préparation de l'extracteur Excel de données d'effectifs"
    this._startExcelTxn(label)
    try {
      Sentry.withScope((scope) => {
        try {
          scope.setTag('latency_event', label)
          scope.setExtra('latency_event', label)
          scope.setFingerprint(['extracteur-excel-effectifs-start', String(Date.now())])
        } catch {}
        Sentry.captureMessage('extracteur: export excel started', 'info')
      })
    } catch {}
    let startExtract = true
    setTimeout(() => {
      if (startExtract) this.appService.appLoading.next(true)
    }, 5000)

    const backupId = this.humanResourceService.backupId.getValue()
    if (!backupId) {
      try {
        Sentry.addBreadcrumb({ category: 'extractor', level: 'warning', message: 'missing backupId' })
      } catch {}
      alert('Impossible de démarrer l’export (juridiction manquante)')
      this._finishExcelTxn('error')
      return
    }
    const payload = {
      backupId,
      dateStart: setTimeToMidDay(this.dateStart.getValue()),
      dateStop: setTimeToMidDay(this.dateStop.getValue()),
      categoryFilter: this.selectedCategory.getValue(),
    }
    try {
      Sentry.addBreadcrumb({
        category: 'extractor',
        level: 'info',
        message: 'start-filter-list payload',
        data: { ...payload, dateStart: String(payload.dateStart), dateStop: String(payload.dateStop) },
      })
    } catch {}

    return this.serverService
      .postWithoutError(`extractor/filter-list-new`, payload)
      .then(async (resp) => {
        const jobId = (resp && resp.jobId) || null
        const directData = (resp && (resp.result || resp.data)) || null
        // If backend returned data synchronously, skip polling and proceed
        if (!jobId && directData) {
          try {
            const data = { data: directData } as any
            this.tabs = data.data
            if (this.tabs.onglet1.values.length === 0) throw new Error('Aucunes données à exporter pour les critères sélectionnés')
            let viewModel: any = {
              ...this.tabs.viewModel,
              fonctions: data.data.fonctions,
              firstLink: {
                label: 'Consultez notre documentation en ligne ici.',
                url: this.userService.isTJ()
                  ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deeffectifs/le-fichier-excel-de-lextracteur-deeffectifs'
                  : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/extraire-ses-donnees-deeffectifs/le-fichier-excel-de-lextracteur-deeffectifs',
              },
              secondLink: {
                label: 'Pour une présentation de la méthodologie à suivre, consultez la documentation ici.',
                url: this.userService.isTJ()
                  ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes'
                  : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes',
              },
              thirdLink: {
                label: 'Pour une présentation détaillée de la méthodologie à suivre, consultez la documentation en ligne, disponible ici.',
                url: this.userService.isTJ()
                  ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes'
                  : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes',
              },
              daydate: `- du ${new Date(this.dateStart.getValue()).toLocaleDateString()} au ${new Date(this.dateStop.getValue()).toLocaleDateString()}`,
            }
            viewModel = { ...viewModel, subtitles1: viewModel.subtitles1.slice(11) }

            const tplBuf = await fetch(this.userService.isCa() === false ? '/assets/template4.xlsx' : '/assets/template4CA.xlsx').then((resp) =>
              resp.arrayBuffer(),
            )
            let report = await new Renderer().renderFromArrayBuffer(tplBuf, viewModel)
            report = await this.getReport(report, viewModel)
            if (this.tabs.onglet1.values.length === 0) throw new Error('no values')
            const out = await report.xlsx.writeBuffer()
            const filename = this.getFileName()
            // Test-only: expose buffer to Cypress
            exposeDownloadToCypress(out as any, filename + EXCEL_EXTENSION)
            await FileSaver.saveAs(new Blob([out]), filename + EXCEL_EXTENSION)
            this._finishExcelTxn('success')
          } catch (e2) {
            this.showExtractionError(e2)
            this._finishExcelTxn('error')
          } finally {
            this.isLoading.next(false)
            startExtract = false
            this.appService.appLoading.next(false)
          }
          return
        }

        if (!jobId) {
          throw new Error('no jobId')
        }

        let finished = false
        const t0 = Date.now()
        // Allow a test-only override of the hard deadline to accommodate slower CI
        // Read from window.__AJ_E2E_EXPORT_MAX_MS or localStorage.__AJ_E2E_EXPORT_MAX_MS when present
        const HARD_DEADLINE_MS = getE2EExportMaxMs(180000) // 3 minutes max
        let intervalId: any = null

        const cleanAll = () => {
          this.isLoading.next(false)
          startExtract = false
          this.appService.appLoading.next(false)
          if (intervalId) clearInterval(intervalId)
        }

        const checkStatus = async () => {
          if (Date.now() - t0 > HARD_DEADLINE_MS) {
            finished = true
            cleanAll()
            alert('Polling timeout')
            this._finishExcelTxn('timeout')
            return
          }

          try {
            const r: any = await this.serverService.postWithoutError('extractor/status-filter-list-post', { jobId })
            if (finished) return
            if (r.status === 'done') {
              finished = true
              cleanAll()

              const data = { data: r.result } as any
              this.tabs = data.data

              let viewModel: any = {
                ...this.tabs.viewModel,
                fonctions: data.data.fonctions,
                firstLink: {
                  label: 'Consultez notre documentation en ligne ici.',
                  url: this.userService.isTJ()
                    ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deeffectifs/le-fichier-excel-de-lextracteur-deeffectifs'
                    : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/extraire-ses-donnees-deeffectifs/le-fichier-excel-de-lextracteur-deeffectifs',
                },
                secondLink: {
                  label: 'Pour une présentation de la méthodologie à suivre, consultez la documentation ici.',
                  url: this.userService.isTJ()
                    ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes'
                    : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes',
                },
                thirdLink: {
                  label: 'Pour une présentation détaillée de la méthodologie à suivre, consultez la documentation en ligne, disponible ici.',
                  url: this.userService.isTJ()
                    ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes'
                    : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/ventilateur/extraire-ses-donnees-deeffectifs/remplir-ses-tableaux-detpt-pour-les-ddg-en-quelques-minutes',
                },
                daydate: `- du ${new Date(this.dateStart.getValue()).toLocaleDateString()} au ${new Date(this.dateStop.getValue()).toLocaleDateString()}`,
              }
              viewModel = { ...viewModel, subtitles1: viewModel.subtitles1.slice(11) }

              try {
                const tplBuf = await fetch(this.userService.isCa() === false ? '/assets/template4.xlsx' : '/assets/template4CA.xlsx').then((resp) =>
                  resp.arrayBuffer(),
                )
                let report = await new Renderer().renderFromArrayBuffer(tplBuf, viewModel)
                report = await this.getReport(report, viewModel)
                if (this.tabs.onglet1.values.length === 0) throw new Error('no values')
                const out = await report.xlsx.writeBuffer()
                const filename = this.getFileName()
                // Test-only: expose buffer to Cypress
                exposeDownloadToCypress(out as any, filename + EXCEL_EXTENSION)
                await FileSaver.saveAs(new Blob([out]), filename + EXCEL_EXTENSION)
                this._finishExcelTxn('success')
              } catch (err) {
                console.error(err)
                this.showExtractionError(err)
                this._finishExcelTxn('error')
              }
              return
            }

            if (r.status === 'error') {
              finished = true
              cleanAll()
              alert('Erreur serveur : ' + (r.error || 'Job error'))
              this._finishExcelTxn('error')
              return
            }
            // else queued/running → wait for next tick
          } catch (err) {
            finished = true
            cleanAll()
            console.error('[extractor] polling error', err)
            alert('Erreur de communication avec le serveur')
            this._finishExcelTxn('error')
          }
        }

        // start polling
        intervalId = setInterval(checkStatus, 2000)
        checkStatus()
      })
      .catch((err) => {
        try {
          Sentry.addBreadcrumb({
            category: 'extractor',
            level: 'error',
            message: 'start-filter-list failed',
            data: { status: err?.status, statusText: err?.statusText, url: err?.url, body: String(err?.error || '') },
          })
        } catch {}
        console.error('Error export', err)
        const detail = err?.status ? ` (HTTP ${err.status}${err?.statusText ? ' ' + err.statusText : ''})` : ''
        alert(`Impossible de démarrer l’export${detail}`)
        this._finishExcelTxn('error')
        // Ensure UI loading indicators are cleared even on start failure
        try {
          this.isLoading.next(false)
        } catch {}
        try {
          startExtract = false
        } catch {}
        try {
          this.appService.appLoading.next(false)
        } catch {}
      })
  }

  /**
   * Fonction qui génère automatiquement le nom du fichier téléchargé
   * @returns String - Nom du fichier téléchargé
   */
  getFileName() {
    return `Extraction ETPT_du ${new Date(this.dateStart.getValue()).toJSON().slice(0, 10)} au ${new Date(this.dateStop.getValue())
      .toJSON()
      .slice(0, 10)}_par ${this.userService.user.getValue()!.firstName}_${this.userService.user.getValue()!.lastName!}_le ${new Date().toJSON().slice(0, 10)}`
  }

  /**
   * Creation d'un worksheet excel
   * @param file
   */
  modifyExcel(file: any) {
    import('xlsx').then(async (xlsx) => {
      const data = await file.arrayBuffer()
      let wb = xlsx.read(data)
      const worksheet = xlsx.utils.json_to_sheet(this.data, {})

      wb.Sheets[wb.SheetNames[0]] = worksheet

      const excelBuffer: any = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      })
      const filename = this.getFileName()
      const datas: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      })
      FileSaver.saveAs(datas, filename + EXCEL_EXTENSION)
    })
  }

  /**
   * Formate Excel juridiction list
   * @param viewModel
   */
  async formatListTpx(viewModel: any) {
    return ['"' + (await [...viewModel.tpxlist, ...viewModel.isolatedCPH].join(',').replaceAll("'", "'").replaceAll('(', '').replaceAll(')', '')) + '"']
  }

  /**
   * Préserve la protection des cellules en déverrouillant les cellules spécifiées
   * @param report
   * @param worksheetName Nom de l'onglet à protéger
   * @param unlockedCells Liste des cellules ou plages de cellules à déverrouiller (ex: ['A1', 'B2:C5', 'D10'])
   * @returns
   */
  preserveCellProtection(report: any, worksheetName: string, unlockedCells: string[] = []) {
    const worksheetIndex = this.findIndexByName(report.worksheets, worksheetName)
    if (worksheetIndex === null) {
      console.warn(`Worksheet "${worksheetName}" not found`)
      return report
    }

    const worksheet = report.worksheets[worksheetIndex]
    const workbook = report.xlsx

    unlockedCells.forEach((cellRef) => {
      try {
        if (cellRef.includes(':')) {
          const [startCell, endCell] = cellRef.split(':')
          const startCol = this.excelColumnToNumber(startCell.match(/[A-Z]+/)?.[0] || '')
          const startRow = parseInt(startCell.match(/\d+/)?.[0] || '0')
          const endCol = this.excelColumnToNumber(endCell.match(/[A-Z]+/)?.[0] || '')
          const endRow = parseInt(endCell.match(/\d+/)?.[0] || '0')

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const colLetter = this.numberToExcelColumn(col)
              const cell = worksheet.getCell(colLetter + row)
              if (cell) {
                // Dans ExcelJS, la protection se définit directement sur la cellule
                cell.protection = cell.protection || {}
                cell.protection.locked = false
              }
            }
          }
        } else {
          // Cellule unique
          const cell = worksheet.getCell(cellRef)
          if (cell) {
            // Dans ExcelJS, la protection se définit directement sur la cellule
            cell.protection = cell.protection || {}
            cell.protection.locked = false
          }
        }
      } catch (error) {
        console.warn(`Erreur lors du déverrouillage de la cellule ${cellRef}:`, error)
      }
    })

    if (!worksheet.sheetProtection || !worksheet.sheetProtection.sheet) {
      worksheet.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false,
      })
    }

    return report
  }

  /**
   * Convertit une colonne Excel (lettres) en nombre
   * @param column Lettres de la colonne (ex: 'A', 'AB', 'ZZ')
   * @returns Numéro de la colonne (1-based)
   */
  excelColumnToNumber(column: string): number {
    let result = 0
    for (let i = 0; i < column.length; i++) {
      result = result * 26 + (column.charCodeAt(i) - 64)
    }
    return result
  }

  /**
   * Mise en forme du ficher DDG
   * @param report
   * @param viewModel
   * @returns
   */
  async getReport(report: any, viewModel: any) {
    report = this.setJuridictionTab(report, viewModel)

    const indexTab = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0
    const indexTabAjust = this.findIndexByName(report.worksheets, 'ETPT A-JUST') || 0

    report = this.userService.isTJ() ? await this.setJuridictionPickers(report, viewModel) : this.setMatriceJuridiction(report, viewModel)
    //console.log(report.worksheets[this.findIndexByName(report.worksheets, 'ETPT Format DDG DETAIL') || 0])
    report = this.setRedGapConditionnalFormating(report, viewModel)
    report = this.setYellowMainDetailsConditionnalFormating(report, viewModel)
    report = this.setColWidth(report)

    // Configurer l'autoFilter pour les en-têtes (ligne 2 par défaut)
    report = this.setAutoFilter(report, 'ETPT Format DDG', 2, viewModel.days1, 'A')
    report = this.setAutoFilter(report, 'ETPT A-JUST', 2, viewModel.days, 'A')

    this.tabs.onglet2.values.forEach((element: any, index: number) => {
      const indexCell = +(+index + 3)
      const indexFctCol = this.getFonctionCellByAgent(indexCell, viewModel)
      const indexCat = this.getCategoryCellByAgent(indexCell, viewModel)

      report.worksheets[indexTab].getCell('ZZ' + indexCell).value = '' // TO SET ALL PREVIOUS COL

      report = this.setExcelFunctionsBinding(report, indexCell, viewModel)

      report = this.userService.isTJ() ? this.setGapsJEJI(report, indexCell, viewModel) : this.setGapsMineurs(report, indexCell, viewModel)

      report = this.userService.isTJ() ? this.setJuridictionPickerByAgent(report, indexCell, viewModel, indexTab) : report

      report = this.addRecodedFonction(report, indexCell, viewModel, indexFctCol)

      report = this.userService.isTJ()
        ? this.setDopDownAttJByAgentTJ(report, indexFctCol, indexTab)
        : this.setDopDownAttJByAgentCA(report, indexFctCol, indexTab)
      report = this.setDopDownPlaceByAgent(report, indexFctCol, indexTab)
      report = this.setDopDownJAByAgent(report, indexFctCol, indexTab)
      report = this.setDopDownContAJPByAgent(report, indexFctCol, indexTab)
      report = this.setDopDownContAGreffeByAgent(report, indexFctCol, indexCat, indexTab)

      report = this.userService.isTJ() ? this.setTJCPHCol(report, indexCell, viewModel, indexTab, indexTabAjust) : report
    })

    report = this.setAgregatAffichage(report, viewModel)

    const headerLength = Object.keys(viewModel.stats1).length
    report = this.preserveCellProtection(report, 'ETPT Format DDG', ['D3:I' + headerLength, 'I3:D' + headerLength])

    viewModel = this.exceptionsJuridiction(viewModel)

    return report
  }

  /**
   * Génère un model de donnée de référentiel
   * @returns
   */
  generateModel(datas: any | null = null) {
    const referentiels = this.humanResourceService.contentieuxReferentielOnly.getValue()

    let referentiel = new Array()
    let counter = 0
    let sumLists = new Array()

    referentiels.map((r) => {
      let hasChild = false
      if (r.childrens && r.childrens.length > 0) {
        r.childrens?.map((c) => {
          const value = datas?.activities?.find((a: any) => a.contentieux.id === c.id)?.percent || ''
          if (value) {
            hasChild = true
          }
          counter++
          referentiel.push({
            code: c['code_import'],
            label: c.label,
            parent: this.userService.isCa() ? this.referentielCAMappingName(r.label) : this.referentielMappingName(r.label),
            value,
            index: null,
            sum: null,
          })
          sumLists.push('E' + (counter + 8))
        })
      }
      const value = datas?.activities?.find((a: any) => a.contentieux.id === r.id)?.percent || ''
      if (value && !hasChild) {
        console.log('value', value, r)
      }
      counter++
      referentiel.push({
        code: r['code_import'],
        label: '',
        parent: 'TOTAL ' + r.label,
        index: 'E' + (counter + 8),
        sum: value && !hasChild ? value : sumLists,
      })
      sumLists = new Array()
    })

    return referentiel
  }

  /**
   * Génération d'un template de fiche agent
   */
  async generateAgentFile(datas: any | null = null) {
    let referentiel = this.generateModel(datas)
    const viewModel = {
      referentiel,
    }

    fetch(IMPORT_ETP_TEMPLATE)
      // 2. Get template as ArrayBuffer.
      .then((response) => response.arrayBuffer())
      // 3. Fill the template with data (generate a report).
      .then((buffer) => {
        return new Renderer().renderFromArrayBuffer(buffer, viewModel)
      })
      // 4. Get a report as buffer.
      .then(async (report) => {
        report = await this.setStyleXls(report, viewModel)
        if (datas) {
          report = await this.setDatas(report, datas)
        }
        return report.xlsx.writeBuffer()
      })
      // 5. Use `saveAs` to download on browser site.
      .then((buffer) => {
        const filename = 'Feuille_de_temps_Modèle'
        return FileSaver.saveAs(new Blob([buffer]), filename + EXCEL_EXTENSION)
      })
      .catch((err) => console.log('Error writing excel export', err))
  }

  /**
   * Set fiche agent template style
   * @param report
   * @param viewModel
   * @returns
   */
  async setStyleXls(report: any, viewModel: any) {
    const MAG = 'Magistrat'
    const GREFFE = 'Greffe'
    const ADM = 'Autour du magistrat'

    // category picker
    report.worksheets[0].getCell('C2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"MAGISTRAT,GREFFE,AUTOUR DU MAGISTRAT"'],
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      showErrorMessage: true,
      showInputMessage: true,
    }
    // time picker
    report.worksheets[0].getCell('C5').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Temps plein, Temps partiel"'],
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      showErrorMessage: true,
      showInputMessage: true,
    }

    // functions by category
    const findCategoryMag = this.humanResourceService.categories.getValue().find((c: HRCategoryInterface) => c.label === MAG) || null
    const findCategoryGreffe = this.humanResourceService.categories.getValue().find((c: HRCategoryInterface) => c.label === GREFFE) || null
    const findCategoryAdm = this.humanResourceService.categories.getValue().find((c: HRCategoryInterface) => c.label === ADM) || null

    const fonctionsMag = this.humanResourceService.fonctions.getValue().filter((v) => v.categoryId === findCategoryMag?.id)
    const fonctionsGreffe = this.humanResourceService.fonctions.getValue().filter((v) => v.categoryId === findCategoryGreffe?.id)
    const fonctionsAdm = this.humanResourceService.fonctions.getValue().filter((v) => v.categoryId === findCategoryAdm?.id)

    let lineIndex = 0
    for (let i = 0; i < fonctionsMag.length; i++) {
      if (fonctionsMag[i].label) lineIndex++
      report.worksheets[1].getCell('A' + lineIndex).value = fonctionsMag[i].label.toUpperCase()
    }
    lineIndex = 0
    for (let i = 0; i < fonctionsGreffe.length; i++) {
      if (fonctionsGreffe[i].label) lineIndex++
      report.worksheets[1].getCell('B' + lineIndex).value = fonctionsGreffe[i].label.toUpperCase()
    }
    lineIndex = 0
    for (let i = 0; i < fonctionsAdm.length; i++) {
      if (fonctionsAdm[i].label) lineIndex++
      report.worksheets[1].getCell('C' + lineIndex).value = fonctionsAdm[i].label.toUpperCase()
    }

    let globalSum = new Array()

    // sum by parent
    viewModel.referentiel.map((r: any) => {
      if (r.sum !== null) {
        if ((Array.isArray(r.sum) && r.sum.length > 0) || typeof r.sum === 'number') {
          report.worksheets[0].getCell(r.index).value = Array.isArray(r.sum)
            ? {
                formula: '=SUM(' + r.sum.join(',') + ')',
                result: '0',
              }
            : r.sum
        }
        globalSum.push(r.index)
      }
    })

    // total sum
    report.worksheets[0].getCell('E7').value = {
      formula: '=SUM(' + globalSum.join(',') + ')/100',
      result: '0',
    }

    // Calculatrice
    const indexTabMag = this.findIndexByName(report.worksheets, 'Calculatrice magistrats') || 0
    const indexTabFon = this.findIndexByName(report.worksheets, 'Calculatrice fonctionnaires') || 0
    ;[indexTabMag, indexTabFon].map((tab) => {
      ;['F9', 'F14'].map((cel) => {
        report.worksheets[tab].getCell(cel).value = 'unités'
        report.worksheets[tab].getCell(cel).dataValidation = {
          type: 'list',
          formulae: ['"jours,demi-journées,heures"'],
          error: 'Veuillez selectionner une valeur dans le menu déroulant',
        }
      })
      ;['G9', 'F16'].map((cel) => {
        report.worksheets[tab].getCell(cel).value = 'fréquence'
        report.worksheets[tab].getCell(cel).dataValidation = {
          type: 'list',
          formulae: ['"par jour,par semaine,par mois,par an"'],
          error: 'Veuillez selectionner une valeur dans le menu déroulant',
        }
      })
    })

    const indexTabReconvert = this.findIndexByName(report.worksheets, "Reconvertir % d'ETPT") || 0
    report.worksheets[indexTabReconvert].getCell('D3').value = 'MAGISTRAT'
    report.worksheets[indexTabReconvert].getCell('D3').dataValidation = {
      type: 'list',
      formulae: ['"MAGISTRAT,FONCTIONNAIRE"'],
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
    }

    return report
  }

  /**
   * setDatas
   * @param report
   * @param datas
   * @returns
   */
  async setDatas(report: any, datas: any) {
    console.log('datas', datas)
    report.worksheets[0].getCell('C3').value = datas.firstName + ' ' + datas.lastName
    report.worksheets[0].getCell('C2').value = datas.category.toUpperCase()
    report.worksheets[0].getCell('C4').value = datas.fonction.toUpperCase()
    report.worksheets[0].getCell('E5').value = datas.etp
    if (datas.etp === 1) {
      report.worksheets[0].getCell('C5').value = 'Temps plein'
    } else {
      report.worksheets[0].getCell('C5').value = 'Temps partiel'
    }

    return report
  }

  /**
   * Transforme un indice en colonne excel
   * @param num
   * @returns
   */
  numberToExcelColumn(num: number): string {
    if (num <= 0) {
      throw new Error('Le nombre doit être supérieur à 0.')
    }
    let column = ''
    while (num > 0) {
      const remainder = (num - 1) % 26
      column = String.fromCharCode(65 + remainder) + column
      num = Math.floor((num - 1) / 26)
    }
    return column
  }

  /**
   * Permet de retrouver l'indice d'un élément avec le début de sa chaine de caractère
   * @param array
   * @param prefix
   * @returns
   */
  findIndexByPrefix(array: string[], prefix: string): number {
    for (let i = 0; i < array.length; i++) {
      if (array[i].startsWith(prefix)) {
        return i
      }
    }
    return -1
  }

  /**
   * Retourne une liste d'élément au format excel
   * @param array
   * @param index
   * @param referentiel
   * @param separator
   * @returns
   */
  getExcelFormulaFormat(array: string[], index: number, referentiel: string[], separator = ',') {
    let str = ''
    for (let i = 0; i < array.length; i++) {
      let value = this.numberToExcelColumn(this.findIndexByPrefix(referentiel, array[i]) + 1)
      if (value && value.length) str += value + index + separator
    }
    return this.removeLastSeparator(str, separator)
  }

  /**
   * Supprime le dernier séparateur passé en parametre
   * @param input
   * @param separator
   * @returns
   */
  removeLastSeparator(input: string, separator = ','): string {
    if (input.endsWith(separator)) {
      return input.slice(0, -1)
    }
    return input
  }

  /**
   * renvoi la longueur d'une array sans erreurs
   * @param array
   * @returns
   */
  getArrayLength<T>(array: T[] | null | undefined): number {
    return Array.isArray(array) ? array.length : 0
  }

  /**
   * Renvoi l'indice de l'element s'il existe
   * @param items
   * @param targetName
   * @returns
   */
  findIndexByName(items: any[], targetName: string): number | null {
    const index = items.findIndex((item) => item.name === targetName)
    return index !== -1 ? index : null
  }

  /**
   * Initie les selecteur de juridiction
   * @param report
   * @param viewModel
   * @returns
   */
  async setJuridictionPickers(report: any, viewModel: any) {
    const tpxlistExcel = await this.formatListTpx(viewModel)
    // DDG TJ
    const tjIndex = this.findIndexByName(report.worksheets, 'ETPT_TJ_DDG') || 0
    report.worksheets[tjIndex].getCell('D' + +5).value = viewModel.tgilist[0] || viewModel.uniqueJur[0]
    // DDG TPROX
    const tprIndex = this.findIndexByName(report.worksheets, 'ETPT_TPRX_DDG') || 0
    report.worksheets[tprIndex].getCell('D' + +5).value = viewModel.tpxlist[0] || ''
    report.worksheets[tprIndex].getCell('D' + +5).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: tpxlistExcel,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: viewModel.tpxlist.length ? 'Selectionner un TPROX' : "Aucun TPROX n'est disponible pour cette juridiction",
      showErrorMessage: true,
      showInputMessage: true,
    }
    // DDG CPH
    const cphIndex = this.findIndexByName(report.worksheets, 'ETPT_CPH_DDG') || 0
    report.worksheets[cphIndex].getCell('D' + +5).value = viewModel.uniqueJur[0] || ''
    report.worksheets[cphIndex].getCell('D' + +5).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: 'Selectionner une juridiction',
      showErrorMessage: true,
      showInputMessage: true,
    }
    // DDG CONT
    const contIndex = this.findIndexByName(report.worksheets, 'ETPT_JUR_ASS_DDG') || 0
    report.worksheets[contIndex].getCell('D' + +5).value = viewModel.uniqueJur[0] || ''
    report.worksheets[contIndex].getCell('D' + +5).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: 'Selectionner une juridiction',
      showErrorMessage: true,
      showInputMessage: true,
    }
    return report
  }

  /**
   * Définir les largeur de colonne
   * @param report
   * @returns
   */
  setColWidth(report: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0
    report.worksheets[etptDDGIndex].columns = [...this.tabs.onglet2.columnSize]
    report.worksheets[etptDDGIndex].columns[0].width = 0
    report.worksheets[etptDDGIndex].columns[1].width = 0
    report.worksheets[etptDDGIndex].columns[2].width = 0
    report.worksheets[etptDDGIndex].columns[8].width = 20
    report.worksheets[etptDDGIndex].columns[9].width = 0
    report.worksheets[etptDDGIndex].columns[10].width = 0
    report.worksheets[etptDDGIndex].columns[11].width = 0
    report.worksheets[etptDDGIndex].columns[12].width = 0

    let index = 0
    do {
      report.worksheets[etptDDGIndex].columns[13 + index].width = 26
      index++
    } while (index < 4)

    if (this.userService.isCa()) {
      report.worksheets[etptDDGIndex].columns[19].width = 0
    }

    const etptAjustIndex = this.findIndexByName(report.worksheets, 'ETPT A-JUST') || 0
    report.worksheets[etptAjustIndex].columns = [...this.tabs.onglet1.columnSize]
    report.worksheets[etptAjustIndex].columns[0].width = 16
    report.worksheets[etptAjustIndex].columns[7].width = 0
    report.worksheets[etptAjustIndex].columns[8].width = 0
    report.worksheets[etptAjustIndex].columns[9].width = 0
    report.worksheets[etptAjustIndex].columns[10].width = 0

    const agregatIndex = this.findIndexByName(report.worksheets, 'Synthèse ETPT') || 0
    report.worksheets[agregatIndex].columns[0].width = 20

    const fctIndex = this.findIndexByName(report.worksheets, 'Table_Fonctions') || 0
    report.worksheets[fctIndex].columns[0].width = 0

    if (this.userService.isCa()) {
      report.worksheets[fctIndex].columns[6].width = 25
      report.worksheets[fctIndex].columns[5].width = 38
      report.worksheets[fctIndex].columns[4].width = 28
      report.worksheets[fctIndex].columns[3].width = 15
      report.worksheets[fctIndex].columns[2].width = 55
      report.worksheets[fctIndex].columns[1].width = 21
    }

    return report
  }

  /**
   * Définition des fonctions dans Excel TJ
   * @param report
   * @param indexCell
   * @param viewModel
   * @returns
   */
  setExcelFunctionsBinding(report: any, indexCell: number, viewModel: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0

    let concatFct = this.getExcelFormulaFormat(['Catégorie', 'Fonction'], indexCell, viewModel.days1, '&')
    // FONCTION RECODEE ONGLET DDG
    report.worksheets[etptDDGIndex].getCell(this.getExcelFormulaFormat(['Fonction recodée'], indexCell, viewModel.days1)).value = {
      formula: '=IFERROR(VLOOKUP(' + concatFct + ',Table_Fonctions!A:G,6,FALSE),"")',
      result: '0',
    }

    // FONCTION AGREGAT ONGLET DDG
    report.worksheets[etptDDGIndex].getCell(this.getExcelFormulaFormat(['Fonction agrégat'], indexCell, viewModel.days1)).value = {
      formula:
        '=IFERROR(VLOOKUP(' +
        concatFct +
        ',Table_Fonctions!A:G,7,FALSE),' +
        this.getExcelFormulaFormat(['Code fonction par défaut'], indexCell, viewModel.days1) +
        ')',
      result: '',
    }

    return report
  }

  /**
   * Calcul l'écart L3 L4 pour le contentieux Mineurs CA
   * @param report
   * @param indexCell
   * @param viewModel
   */
  setGapsMineurs(report: any, indexCell: number, viewModel: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0

    // ECART CTX MINEURS  ONGLET DDG
    report.worksheets[etptDDGIndex].getCell(
      this.getExcelFormulaFormat(['Ecart CTX MINEURS → détails manquants, à rajouter dans A-JUST'], indexCell, viewModel.days1),
    ).value = {
      formula:
        '=ROUND(' +
        this.getExcelFormulaFormat(['7. TOTAL CONTENTIEUX DES MINEURS'], indexCell, viewModel.days1) +
        '-(' +
        this.getExcelFormulaFormat(['7.1. ACTIVITÉ CIVILE', '7.2. ACTIVITÉ PÉNALE'], indexCell, viewModel.days1, '+') +
        '),3)',
    }
    return report
  }
  /**
   * Calcul l'écart L3 L4 pour le contentieux JE et JI
   * @param report
   * @param indexCell
   * @param viewModel
   * @returns
   */
  setGapsJEJI(report: any, indexCell: number, viewModel: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0

    // ECART JE ONGLET DDG
    report.worksheets[etptDDGIndex].getCell(
      this.getExcelFormulaFormat(['Ecart JE → détails manquants, à rajouter dans A-JUST'], indexCell, viewModel.days1),
    ).value = {
      formula:
        '=ROUND(' +
        this.getExcelFormulaFormat(['6. TOTAL JUGES DES ENFANTS'], indexCell, viewModel.days1) +
        '-(' +
        this.getExcelFormulaFormat(['6.1. ACTIVITÉ CIVILE', '6.2. ACTIVITÉ PÉNALE'], indexCell, viewModel.days1, '+') +
        '),3)',
    }
    // ECART JI ONGLET DDG
    report.worksheets[etptDDGIndex].getCell(
      this.getExcelFormulaFormat(['Ecart JI → détails manquants, à rajouter dans A-JUST'], indexCell, viewModel.days1),
    ).value = {
      formula:
        '=ROUND(' +
        this.getExcelFormulaFormat(["8. TOTAL JUGES D'INSTRUCTION"], indexCell, viewModel.days1) +
        '-(' +
        this.getExcelFormulaFormat(
          ['8.1. SERVICE GÉNÉRAL', '8.11. ECO-FI HORS JIRS', '8.2. JIRS ÉCO-FI', '8.3. JIRS CRIM-ORG', '8.4. AUTRES SECTIONS SPÉCIALISÉES'],
          indexCell,
          viewModel.days1,
          '+',
        ) +
        '),3)',
    }
    return report
  }

  /**
   * Définition des fonction dans Excel CA
   * @param report
   * @param indexCell
   * @param viewModel
   * @returns
   */
  setExcelFunctionsCa(report: any, indexCell: number, viewModel: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0

    let concatFct = this.getExcelFormulaFormat(['Catégorie', 'Fonction'], indexCell, viewModel.days1, '&')

    // FONCTION RECODEE ONGLET DDG => AUTOMATISER PLUS TARD
    report.worksheets[etptDDGIndex].getCell('FA' + indexCell).value = {
      formula: '=IF(H' + indexCell + '="","",VLOOKUP(H' + indexCell + ',Table_Fonctions!C:F,4,FALSE))',
      result: '0',
    }

    // FONCTION AGREGAT ONGLET DDG => AUTOMATISER PLUS TARD
    report.worksheets[etptDDGIndex].getCell('FB' + indexCell).value = {
      formula: '=IFERROR(VLOOKUP(H' + indexCell + ',Table_Fonctions!C:E,3,FALSE),I' + indexCell + ')',
      result: '',
    }
    /**
    // SOCIAUX CIVILS ET COMMERCIAUX  ONGLET DDG
    report.worksheets[2].getCell(
      this.getExcelFormulaFormat(
        [
          'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)',
        ],
        indexCell,
        viewModel.days1
      )
    ).value = {
      formula:
        '=IFERROR(SUM(' +
        this.getExcelFormulaFormat(
          ['1. ', '2. ', '3. ', '4. ', '5. ', '12. ', '7.1. '],
          indexCell,
          viewModel.days1
        ) +
        '),"")',
      result: '0',
    };
    report.worksheets[2].columns[
      this.findIndexByPrefix(
        viewModel.days1,
        'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)'
      )
    ].width = 30;

    // PENAL  ONGLET DDG
    report.worksheets[2].getCell(
      this.getExcelFormulaFormat(
        ['Temps ventilés sur la période (service pénal)'],
        indexCell,
        viewModel.days1
      )
    ).value = {
      formula:
        '=IF(H' +
        indexCell +
        '="","",SUM(' +
        this.getExcelFormulaFormat(
          ['7.2. ', '8. ', '9. ', '10. ', '11. '],
          indexCell,
          viewModel.days1
        ) +
        '))',
      result: '0',
    };
    report.worksheets[2].columns[
      this.findIndexByPrefix(
        viewModel.days1,
        'Temps ventilés sur la période (service pénal)'
      )
    ].width = 30;

    // Ventillation hors indispo  ONGLET DDG
    report.worksheets[2].getCell(
      this.getExcelFormulaFormat(
        [
          "Temps ventilés sur la période (hors indisponibilités relevant de l'action 99)",
        ],
        indexCell,
        viewModel.days1
      )
    ).value = {
      formula:
        '=IF(H' +
        indexCell +
        '="","",SUM(' +
        this.getExcelFormulaFormat(
          [
            'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)',
            'Temps ventilés sur la période (service pénal)',
            '13. TOTAL AUTRES ACTIVITÉS',
          ],
          indexCell,
          viewModel.days1
        ) +
        '))',
      result: '0',
    };
    report.worksheets[2].columns[
      this.findIndexByPrefix(
        viewModel.days1,
        "Temps ventilés sur la période (hors indisponibilités relevant de l'action 99)"
      )
    ].width = 30;

    // Ventillation comprenant indispo  ONGLET DDG
    report.worksheets[2].getCell(
      this.getExcelFormulaFormat(
        [
          "Temps ventilés sur la période (y.c. indisponibilités relevant de l'action 99)",
        ],
        indexCell,
        viewModel.days1
      )
    ).value = {
      formula:
        '=IF(H' +
        indexCell +
        '="","",SUM(' +
        this.getExcelFormulaFormat(
          [
            'Temps ventilés sur la période (contentieux sociaux civils et commerciaux)',
            'Temps ventilés sur la période (service pénal)',
            '13. TOTAL AUTRES ACTIVITÉS',
            "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
          ],
          indexCell,
          viewModel.days1,
          '+'
        ) +
        '))',
      result: '0',
    };
    report.worksheets[2].columns[
      this.findIndexByPrefix(
        viewModel.days1,
        "Temps ventilés sur la période (y.c. indisponibilités relevant de l'action 99)"
      )
    ].width = 30;

    // Soutien  ONGLET DDG
    report.worksheets[2].getCell(
      this.getExcelFormulaFormat(
        ['Soutien (Hors accueil du justiciable)'],
        indexCell,
        viewModel.days1
      )
    ).value = {
      formula:
        '=IF(H' +
        indexCell +
        '="","",SUM(' +
        this.getExcelFormulaFormat(
          [
            '13.1. SOUTIEN (AUTRES)',
            '13.2. FORMATIONS SUIVIES',
            '13.5. EXPERTISES (SUIVI ET LISTES)',
            '13.6. MÉDIATION / CONCILIATION (SUIVI ET LISTES)',
            '13.11. ACTIVITÉS EXTÉRIEURES ET PARTENARIATS',
            '13.12. ÉQUIPEMENT',
            '13.13. COMMUNICATION',
            '13.14. POLITIQUE ASSOCIATIVE ET AIDE AUX VICTIMES',
            '13.15. AUTRES ACTIVITÉS NON JURIDICTIONNELLES',
          ],
          indexCell,
          viewModel.days1
        ) +
        '))',
      result: '0',
    };
    report.worksheets[2].columns[
      this.findIndexByPrefix(
        viewModel.days1,
        'Soutien (Hors accueil du justiciable)'
      )
    ].width = 30;

    report.worksheets[2].columns[15].width = 0;

    */
    return report
  }

  /**
   * Configure l'autoFilter pour les en-têtes de colonne sur une ligne spécifique
   * @param report
   * @param worksheetName Nom de l'onglet
   * @param headerRow Numéro de la ligne d'en-tête (par défaut 2)
   * @param viewModel
   * @param startColumn Colonne de début (par défaut 'A')
   * @returns
   */
  setAutoFilter(report: any, worksheetName: string, headerRow: number = 2, viewModel: any, startColumn: string = 'A') {
    const worksheetIndex = this.findIndexByName(report.worksheets, worksheetName)
    if (worksheetIndex === null) {
      console.warn(`Worksheet "${worksheetName}" not found`)
      return report
    }

    const worksheet = report.worksheets[worksheetIndex]

    // Calculer la dernière colonne dynamiquement basée sur le nombre de colonnes dans days1
    const lastColumn = this.numberToExcelColumn(Object.keys(viewModel).length)

    // Configurer l'autoFilter de la colonne de début jusqu'à la dernière colonne sur la ligne spécifiée
    worksheet.autoFilter = `${startColumn}${headerRow}:${lastColumn}${headerRow}`

    return report
  }

  /**
   * Définition du formatage conditionnel
   * @param report
   * @param viewModel
   * @returns
   */
  setRedGapConditionnalFormating(report: any, viewModel: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG') || 0

    report.worksheets[etptDDGIndex].conditionalFormattings[0].ref =
      'A3:' +
      this.numberToExcelColumn(Object.keys(viewModel.days1).length) +
      (Object.keys(viewModel.stats1).length + 3) +
      ' A2:' +
      this.numberToExcelColumn(Object.keys(viewModel.days1).length) +
      '2 A1:G1 I1:EY1'

    report.worksheets[etptDDGIndex].conditionalFormattings[0].rules.ref =
      'A3:' + this.numberToExcelColumn(Object.keys(viewModel.days1).length) + (Object.keys(viewModel.stats1).length + 3) + ' A2:EZ2 A1:G1 I1:EY1'

    return report
  }

  /**
   * Définition du formatage conditionnel
   * @param report
   * @param viewModel
   * @returns
   */
  setYellowMainDetailsConditionnalFormating(report: any, viewModel: any) {
    const etptDDGIndex = this.findIndexByName(report.worksheets, 'ETPT Format DDG DETAIL') || 0

    // nombre de lignes à couvrir (fallback robuste)
    const logCount = Math.max(0, Object.keys(viewModel.ongletLogs || {}).length + 1)
    // garantir au moins la ligne 2
    const lastRow = Math.max(2, logCount)

    console.log(report.worksheets[etptDDGIndex])
    // listes des plages (préfixe jusqu'à la dernière ligne)
    const ranges = ['A2:F', 'G2:N', 'I2:K', 'L2:L', 'N2:N', 'O2:O', 'O2:U', 'Q2:R', 'S2:S', 'U2:U']

    ranges.forEach((prefix, idx) => {
      const ref = `${prefix}${lastRow}`
      const cf = report.worksheets[etptDDGIndex].conditionalFormattings[idx + 1]
      if (cf) {
        cf.ref = ref
        if (cf.rules) cf.rules.ref = ref
      }
    })

    return report
  }

  /**
   * Initie le selecteur de juridiction
   * @param report
   * @param indexCell
   * @param viewModel
   * @returns
   */
  setJuridictionPickerByAgent(report: any, indexCell: number, viewModel: any, indexTab: number) {
    // CHOIX juridiction TPRX TJ onglet ETPT DDG
    report.worksheets[indexTab].getCell(this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days1)).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      showErrorMessage: true,
      showInputMessage: true,
    }
    return report
  }

  /**
   * Retourne l'indice de la colonne Fonction
   * @param indexCell
   * @param viewModel
   * @returns
   */
  getFonctionCellByAgent(indexCell: number, viewModel: any): string {
    return this.getExcelFormulaFormat(['Fonction'], indexCell, viewModel.days1)
  }

  /**
   * Retourne l'indice de la colonne Catégorie
   * @param indexCell
   * @param viewModel
   * @returns
   */
  getCategoryCellByAgent(indexCell: number, viewModel: any): string {
    return this.getExcelFormulaFormat(['Catégorie'], indexCell, viewModel.days1)
  }

  /**
   * Initie le menu placé add/sub
   * @param report
   * @param indexFctCol
   * @returns
   */
  setDopDownPlaceByAgent(report: any, indexFctCol: string, indexTab: number) {
    // CHOIX PLACE ADD OU SUB ONGLET DDG
    const fonctionCellToCheck = (report.worksheets[indexTab].getCell(indexFctCol).value! as string) || ''

    if (fonctionCellToCheck.includes('PLACÉ') || (this.userService.isCa() && (fonctionCellToCheck === 'VPP' || fonctionCellToCheck === 'JP'))) {
      report.worksheets[indexTab].getCell(indexFctCol).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [
          `"${report.worksheets[indexTab].getCell(indexFctCol).value} ADDITIONNEL,${report.worksheets[indexTab].getCell(indexFctCol).value} SUBSTITUTION"`,
        ],
      }
      report.worksheets[indexTab].getCell(indexFctCol).value = `${report.worksheets[indexTab].getCell(indexFctCol).value} ADDITIONNEL`
    }

    return report
  }

  /**
   * Initie le menu JA
   * @param report
   * @param indexFctCol
   */
  setDopDownJAByAgent(report: any, indexFctCol: string, indexTab: number) {
    if (report.worksheets[indexTab].getCell(indexFctCol).value === 'JA') {
      report.worksheets[indexTab].getCell(indexFctCol).value = 'JA Siège autres'
      report.worksheets[indexTab].getCell(indexFctCol).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: this.userService.isCa() ? ['"JA Siège autres,JA Social,JA Parquet"'] : ['"JA Siège autres,JA Social,JA Parquet,JA JAP,JA JE,JA JI,JA JLD"'],
      }
    }
    return report
  }

  /**
   * Initie le menu Att. justice pour le TJ
   * @param report
   * @param indexFctCol
   * @returns
   */
  setDopDownAttJByAgentTJ(report: any, indexFctCol: string, indexTab: number) {
    if (report.worksheets[indexTab].getCell(indexFctCol).value === 'Att. J') {
      report.worksheets[indexTab].getCell(indexFctCol).value = 'Att. J Siège autres'
      report.worksheets[indexTab].getCell(indexFctCol).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Att. J Siège autres,Att. J Social,Att. J Parquet,Att. J JAP,Att. J JE,Att. J JI,Att. J JLD"'],
      }
    }
    return report
  }

  /**
   * Initie le menu Att. justice pour la CA
   * @param report
   * @param indexFctCol
   * @returns
   */
  setDopDownAttJByAgentCA(report: any, indexFctCol: string, indexTab: number) {
    if (report.worksheets[indexTab].getCell(indexFctCol).value === 'Att. J') {
      report.worksheets[indexTab].getCell(indexFctCol).value = 'Att. J Siège autres'
      report.worksheets[indexTab].getCell(indexFctCol).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Att. J Siège autres,Att. J Parquet,Att. J Social"'],
      }
    }
    return report
  }

  /**
   * Initie le menu CONT A JP pour Greffe et Contractuel
   * @param report
   * @param indexFctCol
   * @returns
   */
  setDopDownContAJPByAgent(report: any, indexFctCol: string, indexTab: number) {
    if (report.worksheets[indexTab].getCell(indexFctCol).value === 'CONT A JP') {
      report.worksheets[indexTab].getCell(indexFctCol).value = 'CONT A JP Siège'
      report.worksheets[indexTab].getCell(indexFctCol).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"CONT A JP Siège,CONT A JP Parquet"'],
      }
    }
    return report
  }

  /**
   * Initie le menu CONT A Greffe
   * @param report
   * @param indexFctCol
   * @returns
   */
  setDopDownContAGreffeByAgent(report: any, indexFctCol: string, indexCat: string, indexTab: number) {
    if (report.worksheets[indexTab].getCell(indexCat).value === 'Greffe' && report.worksheets[indexTab].getCell(indexFctCol).value === 'CONT A') {
      report.worksheets[indexTab].getCell(indexFctCol).value = 'CONT A Autres'
      report.worksheets[indexTab].getCell(indexFctCol).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"CONT A VIF Siège,CONT A VIF Parquet,CONT A Autres"'],
      }
    }
    return report
  }

  /**
   * Initie les juridictions CA
   * @param report
   * @param viewModel
   * @returns
   */
  setMatriceJuridiction(report: any, viewModel: any) {
    const indexTabCa = this.findIndexByName(report.worksheets, 'ETPT_CA_JUR_DDG') || 0
    const indexTabAssJu = this.findIndexByName(report.worksheets, 'ETPT_ATTACHES_JUSTICE_DDG') || 0

    report.worksheets[indexTabCa].getCell('D' + +3).value = viewModel.tgilist[0] || viewModel.uniqueJur[0]
    report.worksheets[indexTabAssJu].getCell('A' + +3).value = viewModel.tgilist[0] || viewModel.uniqueJur[0]
    return report
  }

  /**
   * Mise en place de l'affichage onglet Agregat DDG
   * @param report
   * @param viewModel
   * @returns
   */
  setAgregatAffichage(report: any, viewModel: any) {
    // ONGLET AGREGAT
    report.worksheets[3].getCell('A' + +3).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: viewModel.tProximite,
      error: 'Veuillez selectionner une valeur dans le menu déroulant',
      prompt: 'Selectionner une juridiction pour mettre à jour le tableau de synthèse ci-après',
      showErrorMessage: true,
      showInputMessage: true,
    }

    // ONGLET AGGREGAT MESSAGE SI ECART
    report.worksheets[3]['_rows'][6].height = 50
    report.worksheets[3].getCell('F7').value = {
      formula:
        "=IF(OR('Synthèse ETPT'!L6<>'Synthèse ETPT'!L7,'Synthèse ETPT'!S6<>'Synthèse ETPT'!S7,'Synthèse ETPT'!U6<>'Synthèse ETPT'!U7),CONCATENATE(\"Temps ventilés sur la période (hors action 99) :\",CHAR(10),\"ℹ️ Des ventilations sont incomplètes, se référer à la colonne R de l’onglet ETPT format DDG\"),\"Temps ventilés sur la période (hors action 99)\")",
      result:
        '"Temps ventilés sur la période (hors action 99) : Des ventilations sont incomplètes,",CHAR(10),"se référer à la colonne R de l’onglet ETPT format DDG"',
    }
    return report
  }

  /**
   * Traitement des exceptions
   * @param viewModel
   * @returns
   */
  exceptionsJuridiction(viewModel: any) {
    if (viewModel.arrondissement === "TJ LES SABLES D'OLONNE") {
      viewModel.tProximite = viewModel.tProximite.map((value: string) => {
        if (value.includes('DOLONNE')) return value.replaceAll('DOL', "D'OL")
        return value
      })
    }
    return viewModel
  }

  /**
   * Documente l'onglet Juridiction dans le ficher DDG
   * @param report
   * @param viewModel
   * @returns
   */
  setJuridictionTab(report: any, viewModel: any) {
    const juridictionIndex = this.findIndexByName(report.worksheets, 'Juridictions') || 0
    // ONGLET JURIDICTION
    viewModel.tgilist.map((value: any, index: any) => {
      report.worksheets[juridictionIndex].getCell('B' + (+index + 1)).value = value
    })
    viewModel.tpxlist.map((value: any, index: any) => {
      report.worksheets[juridictionIndex].getCell('E' + (+index + 1)).value = value
    })
    viewModel.cphlist.map((value: any, index: any) => {
      report.worksheets[juridictionIndex].getCell('H' + (+index + 1)).value = value
    })
    const TJCPH = [...viewModel.tgilist, ...viewModel.isolatedCPH]
    TJCPH.map((value: any, index: any) => {
      report.worksheets[juridictionIndex].getCell('J' + (+index + 1)).value = value
    })
    return report
  }
  /**
   * @param report
   * @param indexCell
   * @param viewModel
   * @param indexFctCol
   */
  addRecodedFonction(report: any, indexCell: number, viewModel: any, indexFctCol: string) {
    const indexTab = this.findIndexByName(report.worksheets, 'ETPT A-JUST') || 0

    report.worksheets[indexTab].getCell(this.getExcelFormulaFormat(['Fonction recodée'], indexCell, viewModel.days)).value = {
      formula: '=IFERROR(VLOOKUP(A' + indexCell + ',\'ETPT Format DDG\'!A:J,10,FALSE),"")',
      result: '0',
    }

    return report
  }

  /**
   * Ajoute une colonne auxiliaire afin de savoir si l'agent appartient au TJ ou à un CPH détaché
   * @param report
   * @param indexCell
   * @param viewModel
   */
  setTJCPHCol(report: any, indexCell: number, viewModel: any, indexTab: number, indexTabAjust: number) {
    const indexJuridiction = this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days1)
    const indexTJCPH = this.getExcelFormulaFormat(['TJCPH'], indexCell, viewModel.days1)

    report.worksheets[indexTab].getCell(indexTJCPH).value = {
      formula: '=IF(OR(LEFT(' + indexJuridiction + ', 3)="TJ ", LEFT(' + indexJuridiction + ', 4)="CPH "), "OUI", "NON")',
      result: '',
    }

    const indexTJCPHAjust = this.getExcelFormulaFormat(['TJCPH'], indexCell, viewModel.days)

    report.worksheets[indexTabAjust].getCell(indexTJCPHAjust).value = {
      formula: "='ETPT Format DDG'!" + this.getExcelFormulaFormat(['TJCPH'], indexCell, viewModel.days1),
      result: '',
    }

    const indexJuridictionAjust = this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days)

    report.worksheets[indexTabAjust].getCell(indexJuridictionAjust).value = {
      formula: "='ETPT Format DDG'!" + this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days1),
      result: '',
    }

    return report
  }

  /**
   *
   * @param report
   * @param indexCell
   * @param viewModel
   * @param indexTab
   * @param indexTabAjust
   */
  setJuridictionAjust(report: any, indexCell: number, viewModel: any, indexTab: number, indexTabAjust: number) {
    const indexJuridiction = this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days1)

    const indexJuridictionAjust = this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days)

    report.worksheets[indexTabAjust].getCell(indexJuridictionAjust).value = {
      formula: "='ETPT Format DDG'!" + this.getExcelFormulaFormat(['Juridiction'], indexCell, viewModel.days1),
      result: '',
    }

    return report
  }
}
