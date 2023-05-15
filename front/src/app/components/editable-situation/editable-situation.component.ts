import { Component, Input, OnChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { decimalToStringDate } from 'src/app/utils/dates'

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
  constructor() {}

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


    const coverage = Number(this.formWhiteSim.controls['totalOut'].value) / Number(this.formWhiteSim.controls['totalIn'].value)*100
    this.formWhiteSim.controls['realCoverage'].setValue(String(Math.round(coverage))+'%')
    const dtes = Number(this.formWhiteSim.controls['lastStock'].value)/Number(this.formWhiteSim.controls['totalOut'].value)
    this.formWhiteSim.controls['realDTESInMonths'].setValue(String(Math.round(dtes))+' mois')
    const tmd = (17.333 * 8 * Number(this.formWhiteSim.controls['totalOut'].value))/Number(this.formWhiteSim.controls['etpMag'].value)
    this.formWhiteSim.controls['magRealTimePerCase'].setValue(decimalToStringDate(tmd))
    this.endSituation = {
      totalIn: Number(this.formWhiteSim.controls['totalIn'].value),
      totalOut: Number(this.formWhiteSim.controls['totalOut'].value),
      lastStock: Math.floor(Number(this.formWhiteSim.controls['lastStock'].value)) +
            Math.floor((this.nbOfDays / (365 / 12)) * Number(this.formWhiteSim.controls['totalIn'].value)) -
            Math.floor(( this.nbOfDays / (365 / 12)) * Number(this.formWhiteSim.controls['totalOut'].value))
      ,
      etpMag: Number(this.formWhiteSim.controls['etpMag'].value),
      etpFon: Number(this.formWhiteSim.controls['etpFon'].value),
      etpCont: Number(this.formWhiteSim.controls['etpCont'].value),
      realCoverage: String(this.formWhiteSim.controls['realCoverage'].value),
      realDTESInMonths: String(this.formWhiteSim.controls['realDTESInMonths'].value),
      magRealTimePerCase: String(this.formWhiteSim.controls['magRealTimePerCase'].value)
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
