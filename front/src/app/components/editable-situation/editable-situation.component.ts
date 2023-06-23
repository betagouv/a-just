import { Component, Input, OnChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { SimulatorInterface } from 'src/app/interfaces/simulator'
import { SimulatorService } from 'src/app/services/simulator/simulator.service'
import { decimalToStringDate, stringToDecimalDate } from 'src/app/utils/dates'

@Component({
  selector: 'aj-editable-situation',
  templateUrl: './editable-situation.component.html',
  styleUrls: ['./editable-situation.component.scss'],
})
export class EditableSituationComponent implements OnChanges{
  /**
   * Number of day to simulate
   */
  @Input() nbOfDays: number = 0
  /**
   * RegEx
   */
  numberRegex = "^[0-9]*$"
  /**
   * Formulaire de saisie
   */
  formWhiteSim = new FormGroup({
    totalIn: new FormControl('',[
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    totalOut: new FormControl('',[
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    lastStock: new FormControl('',[
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    etpMag: new FormControl('',[
      Validators.required,
      Validators.pattern(this.numberRegex),
    ]),
    etpFon: new FormControl(''),
    etpCont: new FormControl(''),
    realCoverage: new FormControl(''),
    realDTESInMonths: new FormControl(''),
    magRealTimePerCase: new FormControl(''),
  })

  endSituation = {
    totalIn: 0,
    totalOut: 0,
    lastStock: 0,
    etpMag: 0,
    etpFon: 0,
    etpCont: 0,
    realCoverage: '',
    realDTESInMonths: '',
    magRealTimePerCase: ''
  }
  /**
   * Expression reguliaire number positiv only
   */
  regex = "/^\d+$/"
  /**
   * Objet regex
   */
  regexObj = new RegExp('^[0-9]+$')
  /**
   * Bool to check if beginning situation is validated
   */
  isValidatedWhiteSimu: boolean =false
/**
 * Afficher la situation de fin
 */
  displayEndSituation: boolean = false

  /**
   * Constructor
   */
  constructor(private simulatorService: SimulatorService) {}

  ngOnChanges(changes: any){
    console.log(changes)
    if (this.isValidatedWhiteSimu) this.generateEndSituation()
  }
  /**
   * Validate beginning situation for white simulator
   */
  validateWhiteSimulator() {
    this.generateEndSituation()
    console.log(this.nbOfDays)
    this.isValidatedWhiteSimu = true
    this.displayEndSituation = true
    this.simulatorService.isValidatedWhiteSimu.next(this.isValidatedWhiteSimu)
    
    console.log(this.formWhiteSim.getRawValue())
    let {     totalIn,
      totalOut,
      lastStock,
      etpMag,
      etpFon,
      etpCont,
      realCoverage,
      realDTESInMonths,
      magRealTimePerCase } = this.formWhiteSim.value;

    const actualSituation: SimulatorInterface = {
        totalIn: Number(totalIn)||null,
        totalOut: Number(totalOut)||null,
        lastStock: Number(lastStock)||null,
        etpMag: Number(etpMag)||null,
        etpFon: Number(etpFon)||null,
        etpCont: Number(etpCont)||null,
        realCoverage: Number(realCoverage?.replace('%',''))||null,
        realDTESInMonths: Number(realDTESInMonths?.replace(' mois',''))||null,
        magRealTimePerCase: stringToDecimalDate(magRealTimePerCase||'')||null,
        magCalculateCoverage: null,
        fonCalculateCoverage: null,
        magCalculateDTESInMonths: null,
        fonCalculateDTESInMonths: null,
        magCalculateTimePerCase: null,
        nbMonth: 1,
        etpAffected: null,
    }

    console.log(actualSituation)

    this.simulatorService.situationActuelle.next(actualSituation)
  }
  editWhiteSimulator(){
    this.isValidatedWhiteSimu = false
    this.displayEndSituation = false

  }
  generateEndSituation(){
let newStock = Math.floor(Number(this.formWhiteSim.controls['lastStock'].value)) +
Math.floor((this.nbOfDays / (365 / 12)) * Number(this.formWhiteSim.controls['totalIn'].value)) -
Math.floor(( this.nbOfDays / (365 / 12)) * Number(this.formWhiteSim.controls['totalOut'].value))
newStock = newStock<0?0:newStock

const startTotalIn = Number(this.formWhiteSim.controls['totalIn'].value)
const startTotalOut = Number(this.formWhiteSim.controls['totalOut'].value)
const startLastStock = Number(this.formWhiteSim.controls['lastStock'].value)
const startetpMag= Number(this.formWhiteSim.controls['etpMag'].value)
const startetpFon= Number(this.formWhiteSim.controls['etpFon'].value)
const startetpCont= Number(this.formWhiteSim.controls['etpCont'].value)
const startrealCoverage= String(this.formWhiteSim.controls['realCoverage'].value)
const startrealDTESInMonths= String(this.formWhiteSim.controls['realDTESInMonths'].value)
const startmagRealTimePerCase= String(this.formWhiteSim.controls['magRealTimePerCase'].value)
// AJUSTER LES PROCHAINS PARAMETRE SET UP LA SITUATION PROJETEE
this.simulatorService.situationActuelle.next({
  totalIn: startTotalIn,
  totalOut: startTotalOut,
  lastStock: startLastStock,
  etpMag: startetpMag,
  etpFon: startetpFon,
  etpCont: startetpCont,
  realCoverage: Number(startrealCoverage),
  realDTESInMonths: Number(startrealDTESInMonths),
  magRealTimePerCase: Number(startmagRealTimePerCase),
  magCalculateCoverage: null,
  fonCalculateCoverage: null,
  magCalculateDTESInMonths: null,
  fonCalculateDTESInMonths: null,
  magCalculateTimePerCase: null,
  nbMonth: 0, // A CORIGER
  etpAffected: null
})
    const coverage = startTotalOut / startTotalIn*100
    this.formWhiteSim.controls['realCoverage'].setValue(String(Math.round(coverage))+'%')
    const dtes = startLastStock/startTotalOut
    this.formWhiteSim.controls['realDTESInMonths'].setValue(String(Math.round(dtes))+' mois')
    const tmd = (17.333 * 8 * startTotalOut)/startetpMag
    this.formWhiteSim.controls['magRealTimePerCase'].setValue(decimalToStringDate(tmd))
    this.endSituation = {
      totalIn: startTotalIn,
      totalOut: startTotalOut,
      lastStock: Math.floor(startLastStock) +
            Math.floor((this.nbOfDays / (365 / 12)) * startTotalIn) -
            Math.floor(( this.nbOfDays / (365 / 12)) * startTotalOut)
      ,
      etpMag: startetpMag,
      etpFon: startetpFon,
      etpCont: startetpCont,
      realCoverage: String(startrealCoverage),
      realDTESInMonths: String(startrealDTESInMonths),
      magRealTimePerCase: String(startmagRealTimePerCase)
    }
  }
  validateNo(e:any){
    const charCode = e.which ? e.which : e.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false
    }
    return true
  }
}
