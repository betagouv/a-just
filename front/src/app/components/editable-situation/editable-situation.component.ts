import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { basicEtptData } from 'src/app/constants/etpt-calculation'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { decimalToStringDate, stringToDecimalDate } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'

@Component({
  selector: 'aj-editable-situation',
  templateUrl: './editable-situation.component.html',
  styleUrls: ['./editable-situation.component.scss'],
})
export class EditableSituationComponent implements OnChanges {
  /**
   * Number of day to simulate
   */
  @Input() nbOfDays: number = 0
  /**
   * Catégorie selectionnée
   */
  @Input() category: string|null= null
  /**
   * RegEx
   */
  numberRegex = '^[0-9]*$'
  /**
   * Formulaire de saisie
   */
  formWhiteSim = new FormGroup({
    totalIn: new FormControl('', [
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    totalOut: new FormControl('', [
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    lastStock: new FormControl('', [
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    etpMag: new FormControl('', [
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    etpFon: new FormControl('', [
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    etpCont: new FormControl({value:'',disabled: true}),
    realCoverage: new FormControl({value:'',disabled: true}),
    realDTESInMonths: new FormControl({value:'',disabled: true}),
    magRealTimePerCase: new FormControl({value:'',disabled: true}),
  })

  endSituation = {
    totalIn: 0,
    totalOut: 0,
    lastStock: 0,
    etpMag: 0,
    etpFon: 0,
    etpCont: null,
    realCoverage: 0,
    realDTESInMonths: 0,
    magRealTimePerCase: 0,
  }

  endSituationDisplay = {
    realCoverage: '',
    realDTESInMonths: '',
    magRealTimePerCase: '',
  }
  /**
   * Expression reguliaire number positiv only
   */
  regex = '/^d+$/'
  /**
   * Objet regex
   */
  regexObj = new RegExp('^[0-9]+$')
  /**
   * Bool to check if beginning situation is validated
   */
  isValidatedWhiteSimu: boolean = false
  /**
   * Afficher la situation de fin
   */
  displayEndSituation: boolean = false

  /**
   * Constructor
   */
  constructor(private simulatorService: SimulatorService) {}

  ngOnChanges(changes: any) {
    if (this.isValidatedWhiteSimu) this.generateEndSituation()
    console.log(changes.category.currentValue)
    if (changes && changes.category &&  Object.keys(changes.category).includes('currentValue')){
    if (changes.category.currentValue==='MAGISTRAT') {
      this.formWhiteSim.controls['etpMag'].enable()
      this.formWhiteSim.controls['etpFon'].disable()
    }
    else {
      this.formWhiteSim.controls['etpMag'].disable()
      this.formWhiteSim.controls['etpFon'].enable()
    }
  }
  }
  /**
   * Validate beginning situation for white simulator
   */
  validateWhiteSimulator() {
    let {
      totalIn,
      totalOut,
      lastStock,
      etpMag,
      etpFon,
      etpCont,
      realCoverage,
      realDTESInMonths,
      magRealTimePerCase,
    } = this.formWhiteSim.value

    if (![totalIn, totalOut, lastStock].includes('') && (etpMag!=='' || etpFon!=='')) {
      this.generateEndSituation()
      this.isValidatedWhiteSimu = true
      this.displayEndSituation = true
      this.simulatorService.isValidatedWhiteSimu.next(this.isValidatedWhiteSimu)
    }
  }
  editWhiteSimulator() {
    this.isValidatedWhiteSimu = false
    this.displayEndSituation = false
    this.simulatorService.isValidatedWhiteSimu.next(false)
  }
  generateEndSituation() { 
    console.log(this.nbOfDays)
    let newStock =
      Math.floor(Number(this.formWhiteSim.controls['lastStock'].value) +
        (this.nbOfDays / (365 / 12)) *
          Number(this.formWhiteSim.controls['totalIn'].value)
       -
        (this.nbOfDays / (365 / 12)) *
          Number(this.formWhiteSim.controls['totalOut'].value)
      )
    newStock = newStock < 0 ? 0 : newStock

    const startTotalIn = Number(this.formWhiteSim.controls['totalIn'].value)
    const startTotalOut = Number(this.formWhiteSim.controls['totalOut'].value)
    const startLastStock = Number(this.formWhiteSim.controls['lastStock'].value)
    const startetpMag = Number(this.formWhiteSim.controls['etpMag'].value)
    const startetpFon = Number(this.formWhiteSim.controls['etpFon'].value)
    const startetpCont = Number(this.formWhiteSim.controls['etpCont'].value)
    const startrealCoverage = String(
      this.formWhiteSim.controls['realCoverage'].value
    )
    const startrealDTESInMonths = String(
      this.formWhiteSim.controls['realDTESInMonths'].value
    )
    const startmagRealTimePerCase = String(
      this.formWhiteSim.controls['magRealTimePerCase'].value
    )


    const coverage = Math.round((startTotalOut / startTotalIn) * 100)
    this.formWhiteSim.controls['realCoverage'].setValue(
      String(coverage) + '%'
    )
    const dtes = fixDecimal(startLastStock / startTotalOut)
    this.formWhiteSim.controls['realDTESInMonths'].setValue(
      String(dtes) + ' mois'
    )
    const prefix1 = this.category==='MAGISTRAT'?'nbDaysByMagistrat':'nbDaysByFonctionnaire'
    const prefix2 = this.category==='MAGISTRAT'?'nbHoursPerDayAndMagistrat':'nbHoursPerDayAndFonctionnaire'
    const etpToUse = this.category==='MAGISTRAT'?startetpMag:startetpFon
    //tmd = ((basicEtptData[prefix1]/12) * basicEtptData[prefix2] * etpToUse) / startTotalOut
    
    let realTime = fixDecimal((basicEtptData[prefix1] * basicEtptData[prefix2] * etpToUse) / (startTotalOut * 12), 100)
    const tmd = Math.trunc(realTime) + Math.round((realTime - Math.trunc(realTime)) * 60) / 60

    this.formWhiteSim.controls['magRealTimePerCase'].setValue(
      decimalToStringDate(tmd)
    )

      // AJUSTER LES PROCHAINS PARAMETRE SET UP LA SITUATION PROJETEE
      this.simulatorService.situationActuelle.next({
        totalIn: startTotalIn,
        totalOut: startTotalOut,
        lastStock: startLastStock,
        etpMag: startetpMag,
        etpFon: startetpFon,
        etpCont: startetpCont,
        realCoverage: coverage/100,
        realDTESInMonths: dtes,
        magRealTimePerCase: tmd,
        magCalculateCoverage: 0,
        fonCalculateCoverage: 0,
        magCalculateDTESInMonths: 0,
        fonCalculateDTESInMonths: 0,
        magCalculateTimePerCase: 0,
        nbMonth: 0,
        etpAffected: [{name: 'Magistrat', totalEtp: 0, rank: 1},{name: 'Greffe', totalEtp: 0, rank: 2},{name: 'Autour du magistrat', totalEtp: 0, rank: 3}]
      })

    const endStock =
      Math.floor(startLastStock +
        (this.nbOfDays / (365 / 12)) *
        startTotalIn
       -
        (this.nbOfDays / (365 / 12)) *
        startTotalOut
      )


    this.endSituation = {
      totalIn: startTotalIn,
      totalOut: startTotalOut,
      lastStock: endStock,
      etpMag: startetpMag,
      etpFon: startetpFon,
      etpCont: null,
      realCoverage: coverage,
      realDTESInMonths: endStock / startTotalOut,
      magRealTimePerCase: tmd,
    }
    this.endSituationDisplay.realCoverage =  fixDecimal(coverage) + '%'
    this.endSituationDisplay.realDTESInMonths =
      fixDecimal(endStock / startTotalOut) + ' mois'
    this.endSituationDisplay.magRealTimePerCase = decimalToStringDate(tmd)

    this.simulatorService.situationProjected.next({
      ...this.endSituation,  
      realCoverage: coverage/100,    
      magCalculateCoverage: null,
      fonCalculateCoverage: null,
      magCalculateDTESInMonths: null,
      fonCalculateDTESInMonths: null,
      magCalculateTimePerCase: null,
      nbMonth: 0,
      etpAffected: null,})
  }
  validateNo(e: any) {
    const charCode = e.which ? e.which : e.keyCode
    if(charCode ===46) return true
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false
    }
    return true
  }
}
