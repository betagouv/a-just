import { Component } from '@angular/core';
import { JuridictionInterface } from 'src/app/interfaces/juridiction';
import { ExtractsDataService } from 'src/app/services/extracts-data/extracts-data.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { orderBy } from 'lodash'
import { getShortMonthString } from 'src/app/utils/dates';
import * as FileSaver from 'file-saver'
import * as xlsx from 'xlsx'

/**
 * Excel file details
 */
const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'

/**
 * Excel file headers for extract
 */
const extractHeaders = [
  ' ',
  'Période',
  'Entrées logiciel',
  'Entrées A-JUSTées',
  'Sorties logiciel',
  'Sorties A-JUSTées',
  'Stock logiciel',
  'Stock A-JUSTé',
]

/**
 * Excel file headers for compare
 */
const compareHeaders = [
  ' ',
  'Période',

  'A-JUST - Entrées',
  'Pharos - Entrées',
  'TJ - Entrées',
  'Ecart A-JUST / Pharos - Entrées',
  'Ecart A-JUST / TJ - Entrées',

  'A-JUST - Sorties',
  'Pharos - Sorties',
  'TJ - Sorties',
  'Ecart A-JUST / Pharos - Sorties',
  'Ecart A-JUST / TJ - Sorties',

  'A-JUST - Stocks',
  'Pharos - Stocks',
  'TJ - Stocks',
  'Ecart A-JUST / Pharos - Stocks',
  'Ecart A-JUST / TJ - Stocks',
]

/**
 * Excel file headers sum for extract
 */
const extractHeadersSum = [
  ' ',
  'Période',
  'Total entrées logiciel',
  'Total entrées après A-JUSTements',
  '% A-JUSTement Entrées',
  'Total sorties logiciel',
  'Total sorties après A-JUSTements',
  '% A-JUSTement Sorties',
  'Stock logiciel',
  'Stock après A-JUSTements',
  '% A-JUSTement Stock',
]

/**
 * Excel file headers sum for compare
 */
const compareHeadersSum = [
  ' ',
  'Période',

  'Total A-JUST - Entrées',
  'Total Pharos - Entrées',
  'Total TJ - Entrées',
  'Ecart A-JUST / Pharos - Entrées',
  'Ecart A-JUST / TJ - Entrées',

  'Total A-JUST - Sorties',
  'Total Pharos - Sorties',
  'Total TJ - Sorties',
  'Ecart A-JUST / Pharos - Sorties',
  'Ecart A-JUST / TJ - Sorties',

  'Total A-JUST - Stocks',
  'Total Pharos - Stocks',
  'Total TJ - Stocks',
  'Ecart A-JUST / Pharos - Stocks',
  'Ecart A-JUST / TJ - Stocks',
]

@Component({
  templateUrl: './data-analyse.page.html',
  styleUrls: ['./data-analyse.page.scss'],
})
export class DataAnalysePage {
  juridictionList: JuridictionInterface[] = [];
  juridictionName: string = ''
  extractBackupId: number | null = null
  extractDateStart: Date | null = null
  extractDateStop: Date | null = null
  comapreBackupId: number | null = null
  compareDateStart: Date | null = null
  compareDateStop: Date | null = null
  data : any = undefined
  sumTab : any = undefined

  constructor(
    private extractDataService: ExtractsDataService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
  ) {}

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.humanResourceService.getBackupList().then((datas : any) => {
      datas.map((elem : JuridictionInterface) => this.juridictionList.push(elem))
    });
    this.referentielService.getReferentiels()
  }

  /**
   * Trier data par code import
   */
  sortByCodeImport(sumTab: any) {
    sumTab = orderBy(sumTab, ['codeUnit', 'codeCent'], ['asc'])
    sumTab.forEach(function (v: any) {
      delete v['codeUnit']
      delete v['codeCent']
      delete v['idReferentiel']
    })
    return sumTab
  }
  
    /**
   * Retourne la largeur de chaque colonne en nombre de charactère
   * @param headers
   * @param element
   * @returns
   */
  getColumnWidth(headers: any, element: any) {
    return headers.map((header: any) => {
      return {
        wch: Math.max(
          header.length,
          element.reduce(
            (w: any, r: any) =>
              Math.max(w || 10, (r[header] || []).length || 10),
            10
          )
        ),
      }
    })
  }

/**
 * Génère le nom du ficher téléchargé
 * @returns 
 */
  getExportFileName(type : string, dateStart: Date, dateStop: Date) {
    return `${type}_${this.getTotalPeriodeLabel(
      dateStart || new Date(),
      dateStop || new Date()
    )}_${this.juridictionName}`
  }

  /**
   * Génère un onglet excel
   * @param headers 
   * @param data 
   * @returns 
   */
  generateWorkSheet(headers: any, data: any) {
    const worksheet = xlsx.utils.json_to_sheet(data, {})
    worksheet['!cols'] = this.getColumnWidth(headers, data)
    return worksheet
  }

  /**
   * Retourne le nom d'un onglet excel formaté
   */
  getMonthTabName(act: any) {
    return (
      getShortMonthString(new Date(act.periode)) +
      ' ' +
      new Date(act.periode).getFullYear()
    )
  }

  /**
   * Retourne le label de la période à extraire
   * @param extractDateStart
   * @param extractDateStop
   * @returns
   */
  getTotalPeriodeLabel(dateStart: Date, dateStop: Date) {
    return (
      'De ' +
      (getShortMonthString(new Date(dateStart)) +
        ' ' +
        new Date(dateStart).getFullYear()) +
      ' à ' +
      (getShortMonthString(new Date(dateStop)) +
        ' ' +
        new Date(dateStop).getFullYear())
    )
  }

  /**
   * Génère la donnée formatée à injecter dans le fichier Excel d'extractionsssss
   * @param act
   * @param monthTabName
   * @returns
   */
  generateFormatedDataMonthForExtract(act: any, monthTabName: string, total = false) {
    const sortCodeArray = act.contentieux.code_import
      .split('.').filter((y: String) => y !== '').map((x: string) => x === '0' ? 0.1 : Number(x))

      
    const ref = this.humanResourceService.contentieuxReferentielOnly.value.map(x => x.id).includes(act.idReferentiel) === true ? true : false
    const obj = {
      [' ']: ref === true ? 'Total ' + act.contentieux.label : act.contentieux.label,
      ['codeUnit']: sortCodeArray[0] || 0,
      ['codeCent']: sortCodeArray[1] * 10 || -1,
      Période: monthTabName,
      [total === true ? 'Total entrées logiciel' : 'Entrées logiciel']: act.originalEntrees,
      [total === true ? 'Total entrées après A-JUSTements' : 'Entrées A-JUSTées']: act.entrees,
      ['% A-JUSTement Entrées']: act.entrees && act.originalEntrees && act.originalEntrees ? Math.abs(((act.entrees - act.originalEntrees) / act.originalEntrees) * 100).toFixed(2) + '%' : null,
      [total === true ? 'Total sorties logiciel' : 'Sorties logiciel']: act.originalSorties,
      [total === true ? 'Total sorties après A-JUSTements' : 'Sorties A-JUSTées']: act.sorties,
      ['% A-JUSTement Sorties']: act.sorties && act.originalSorties && act.originalSorties ? Math.abs(((act.sorties - act.originalSorties) / act.originalSorties) * 100).toFixed(2) + '%' : null,
      ['Stock logiciel']: act.originalStock,
      ['Stock après A-JUSTements']: act.stock,
      ['% A-JUSTement Stocks']: act.stock && act.originalStock && act.originalStock ? Math.abs(((act.stock - act.originalStock) / act.originalStock) * 100).toFixed(2) + '%' : null,
      ['Observations']: ''
    }
    return obj
  }

    /**
   * Génère la donnée formatée à injecter dans le fichier Excel de comparaison
   * @param act
   * @param monthTabName
   * @returns
   */
    generateFormatedDataMonthForCompare(act: any, monthTabName: string, total = false) {
      const sortCodeArray = act.contentieux.code_import
        .split('.').filter((y: String) => y !== '').map((x: string) => x === '0' ? 0.1 : Number(x))
  
        
      const ref = this.humanResourceService.contentieuxReferentielOnly.value.map(x => x.id).includes(act.idReferentiel) === true ? true : false
      const obj = {
        [' ']: ref === true ? 'Total ' + act.contentieux.label : act.contentieux.label,
        ['codeUnit']: sortCodeArray[0] || 0,
        ['codeCent']: sortCodeArray[1] * 10 || -1,
        Période: monthTabName,
        [total === true ? 'Total A-JUST - Entrées' : 'A-JUST - Entrées']: act.entrees ? act.entrees : act.originalEntrees,
        [total === true ? 'Total Pharos - Entrées' : 'Pharos - Entrées']: '',
        [total === true ? 'Total TJ - Entrées' : 'TJ - Entrées']: '',
        ['Ecart A-JUST / Pharos - Entrées']: '',
        ['Ecart A-JUST / TJ - Entrées']: '',
        
        [total === true ? 'Total A-JUST - Sorties' : 'A-JUST - Sorties']:  act.sorties ? act.sorties : act.originalSorties,
        [total === true ? 'Total Pharos - Sorties' : 'Pharos - Sorties']: '',
        [total === true ? 'Total TJ - Sorties' : 'TJ - Sorties']: '',
        ['Ecart A-JUST / Pharos - Sorties']: '',
        ['Ecart A-JUST / TJ - Sorties']: '',

        [total === true ? 'Total A-JUST - Stocks' : 'A-JUST - Stocks']: act.stock ? act.stock : act.originalStock,
        [total === true ? 'Total Pharos - Stocks' : 'Pharos - Stocks']: '',
        [total === true ? 'Total TJ - Stocks' : 'TJ - Stocks']: '',
        ['Ecart A-JUST / Pharos - Stocks']: '',
        ['Ecart A-JUST / TJ - Stocks']: '',
        ['Observations']: ''
      }
      return obj
    }


  onExtractData(form: any) {


    if (!form.juridiction.value) {
      return alert('Veuillez selectionner une juridiction')
    }
    else if (!form.dateStart.value){
      return alert('Veuiller indiquer une date de début')
    }
    else if (!form.dateStop.value) {
      return alert('Veuiller indiquer une date de fin')
    }

    this.extractBackupId = Number(form.juridiction.value)
    this.extractDateStart = new Date(form.dateStart.value)
    this.extractDateStop = new Date(form.dateStop.value)

    this.extractDateStop.setMonth(this.extractDateStop.getMonth() + 1)

    const juridiction = this.juridictionList.filter(elem => elem.id === this.extractBackupId)
    this.juridictionName = juridiction[0].label

    return this.extractDataService.extractdata({backupId: this.extractBackupId, dateStart: this.extractDateStart, dateStop: this.extractDateStop}).then((data) => {
      this.data = data.data.list
      this.sumTab = data.data.sumTab

      if (this.sumTab.length) {
        let monthTabName = ''
        const workbook = xlsx.utils.book_new()

        this.sumTab = this.sumTab.map((act: any) => {
          return this.generateFormatedDataMonthForExtract(
            act,
            this.getTotalPeriodeLabel(
              this.extractDateStart || new Date(),
              this.extractDateStop || new Date()
            ),
            true
          )
        }).filter(
          (r: any) =>
            this.referentielService.idsIndispo.indexOf(r.idReferentiel) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.idReferentiel) === -1
        )

        this.sumTab = this.sortByCodeImport(this.sumTab)
        xlsx.utils.book_append_sheet(
          workbook,
          this.generateWorkSheet(extractHeadersSum, this.sumTab),
          'Total sur la période'
        )

        this.data = Object.keys(this.data).map((key: any) => {
          this.data[key] = this.data[key].map((act: any) => {
            monthTabName = this.getMonthTabName(act)
            return this.generateFormatedDataMonthForExtract(act, monthTabName)
          }).filter(
            (r: any) =>
              this.referentielService.idsIndispo.indexOf(r.idReferentiel) === -1 &&
              this.referentielService.idsSoutien.indexOf(r.idReferentiel) === -1
          )

          this.data[key] = this.sortByCodeImport(this.data[key])
          xlsx.utils.book_append_sheet(
            workbook,
            this.generateWorkSheet(extractHeaders, this.data[key]),
            monthTabName
          )
        })

        const excelBuffer: any = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        })

        const dataSaved: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
        FileSaver.saveAs(dataSaved, this.getExportFileName('Extraction_Données_D_Activité', this.extractDateStart || new Date(), this.extractDateStop || new Date()) + EXCEL_EXTENSION)
      } else {
        return alert('Aucune donnée pour cette juridiction sur la période sélectionée')
      }
    })
  }

  onCompareData(form: any) {

    if (!form.juridiction.value) {
      return alert('Veuillez selectionner une juridiction')
    }
    else if (!form.dateStart.value){
      return alert('Veuiller indiquer une date de début')
    }
    else if (!form.dateStop.value) {
      return alert('Veuiller indiquer une date de fin')
    }

    this.comapreBackupId = Number(form.juridiction.value)
    this.compareDateStart = new Date(form.dateStart.value)
    this.compareDateStop = new Date(form.dateStop.value)

    this.compareDateStop.setMonth(this.compareDateStop.getMonth() + 1)

    const juridiction = this.juridictionList.filter(elem => elem.id === this.comapreBackupId)
    this.juridictionName = juridiction[0].label

    return this.extractDataService.extractdata({backupId: this.comapreBackupId, dateStart: this.compareDateStart, dateStop: this.compareDateStop}).then((data) => {
      this.data = data.data.list
      this.sumTab = data.data.sumTab

      if (this.sumTab.length) {
        let monthTabName = ''
        const workbook = xlsx.utils.book_new()

        this.sumTab = this.sumTab.map((act: any) => {
          console.log('act:', act)
          return this.generateFormatedDataMonthForCompare(
            act,
            this.getTotalPeriodeLabel(
              this.compareDateStart || new Date(),
              this.compareDateStop || new Date()
            ),
            true
          )
        }).filter(
          (r: any) =>
            this.referentielService.idsIndispo.indexOf(r.idReferentiel) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.idReferentiel) === -1
        )

        this.sumTab = this.sortByCodeImport(this.sumTab)
        xlsx.utils.book_append_sheet(
          workbook,
          this.generateWorkSheet(compareHeadersSum, this.sumTab),
          'Total sur la période'
        )

        this.data = Object.keys(this.data).map((key: any) => {
          this.data[key] = this.data[key].map((act: any) => {
            monthTabName = this.getMonthTabName(act)
            return this.generateFormatedDataMonthForCompare(act, monthTabName)
          }).filter(
            (r: any) =>
              this.referentielService.idsIndispo.indexOf(r.idReferentiel) === -1 &&
              this.referentielService.idsSoutien.indexOf(r.idReferentiel) === -1
          )

          this.data[key] = this.sortByCodeImport(this.data[key])
          xlsx.utils.book_append_sheet(
            workbook,
            this.generateWorkSheet(compareHeaders, this.data[key]),
            monthTabName
          )
        })

        const excelBuffer: any = xlsx.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        })

        const dataSaved: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
        FileSaver.saveAs(dataSaved, this.getExportFileName('Comparatif_A-JUST_Pharos', this.compareDateStart || new Date(), this.compareDateStop || new Date()) + EXCEL_EXTENSION)
      } else {
        return alert('Aucune donnée pour cette juridiction sur la période sélectionée')
      }
    })
  }
}
