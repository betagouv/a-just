import { Component } from '@angular/core';
import * as _ from 'lodash';
import { ExtractsDataService } from 'src/app/services/extracts-data/extracts-data.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';
import { parse, stringify } from 'yaml'

interface contentieux {
  "label": string,
  "Code nomenclature": string,
  "filtres": filtre
}

interface filtre {
  "entrees": filtreDetails,
  "sorties": filtreDetails,
  "stock": filtreDetails,
}

interface filtreDetails {
  "NATAFF"?: [], "C_TUS"?: [], "TOTAL"?: string
}

@Component({
  templateUrl: './yaml-tools.page.html',
  styleUrls: ['./yaml-tools.page.scss'],
})
export class YamlToolsPage {
  actionSelection = 0
  existingNAC: string[] = []
  distinctNAC: Array<string> = []
  selectedNACs: Array<string> = []
  distinctPath: Array<any> = []
  selectedPath: Array<string> = []
  countResult = {}
  countResultAfterChange = {}
  pathDictionary = {}
  initialYmlData: any = null
  finalYmlData: any = null
  textResultValue = ''
  contentieuxLabelList: Array<any> = []
  NACToAdd: string = ""
  selectedContentieux: Array<string> = []
  goToStep3_addNac: boolean = false
  displayResult: boolean = false

  constructor() { }

  /**
 * Initialisation du composant
 */
  init() {
    const ymlArea = (document.getElementById('yml') as HTMLInputElement)
    if (ymlArea) ymlArea.value = ''
    const jsonArea = (document.getElementById('json') as HTMLInputElement)
    if (jsonArea) jsonArea.value = ''
    const copyButton = (document.getElementById('copy') as HTMLInputElement)
    if (copyButton) copyButton.innerText = 'Copier'

    this.existingNAC = []
    this.distinctNAC = []
    this.selectedNACs = []
    this.distinctPath = []
    this.selectedPath = []
    this.countResult = {}
    this.countResultAfterChange = {}
    this.pathDictionary = {}
    this.initialYmlData = null
    this.finalYmlData = null
    this.textResultValue = ''
    this.actionSelection = 0
    this.contentieuxLabelList = []
    this.NACToAdd = ""
    this.selectedContentieux = []
    this.goToStep3_addNac = false
    this.displayResult = false
  }

  /**
   * Selection d'une valeur à supprimer
   * @param change 
   */
  onSelectedPathChanged(change: any) {
    this.selectedPath = change
    this.countResult = {}
    this.countResultAfterChange = {}
    this.countResult = this.countNacOccur(change, this.initialYmlData)
  }

  /**
   * Compte le nombre d'occurence d'une NAC selectionnée dans le fichier
   * @param selectedPath 
   * @param yamlData 
   * @returns 
   */
  countNacOccur(selectedPath: Array<string>, yamlData: any) {
    let countResult = {}
    let NacConcerned = selectedPath.map((elem: any) => { return elem.NAC })
    NacConcerned = _.uniq(NacConcerned)
    NacConcerned.map((elem: any) => {
      Object.assign(countResult, { [elem]: (JSON.stringify(yamlData).split(elem).length - 1) })
    })
    return countResult
  }

  /**
   * Supprime toutes les occurences d'une valeur dans une liste
   * @param arr 
   * @param target 
   * @returns 
   */
  removeAll(arr: Array<any>, target: string) {
    var i = 0;
    while (i < arr.length) {
      if (arr[i] === target) {
        arr.splice(i, 1);
      } else {
        ++i;
      }
    }
    return arr;
  }

  /**
   * Supprime les valeurs selectionnées et transforme le resultat en YML
   */
  validateRemoval() {
    const response = confirm("Etes-vous sur de vouloir effectuer cette action ?");
    if (this.selectedPath.length && response) {
      this.displayResult = true
      this.finalYmlData = _.cloneDeep(this.initialYmlData)
      this.selectedPath.map((elem: any) => {
        this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF = this.removeAll(this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF, elem.NAC)
      })
      const message = (document.getElementById('yml') as HTMLInputElement);
      this.finalYmlData = { categories: this.finalYmlData }
      message.value = stringify(this.finalYmlData)
      this.countResultAfterChange = this.countNacOccur(this.selectedPath, this.finalYmlData)
    }
  }

  /**
   * Creer un dictionnaire de NAC en fonction des NAC selectionnées
   * @param change 
   */
  onSelectedChanged(change: any) {
    this.selectedNACs = change
    this.distinctPath = []
    // @ts-ignore
    this.selectedNACs.map(NAC => { this.distinctPath = [...this.pathDictionary[NAC], ...this.distinctPath] })
  }

  /**
   * Copie le clipboard
   * @param element 
   */
  onCopy(element: HTMLElement) {
    const textArea = (document.getElementById('yml') as HTMLInputElement);
    navigator.clipboard.writeText(textArea.value);
    element.innerText = "Copié !";
  }

  /**
   * Réinitialise le bouton copier si le champs est modifié
   * @param element 
   */
  onCopyReset(element: HTMLElement) {
    element.innerText = "Copier";
  }

  /**
   * Transforme le texte YML en Objet et récupère la liste des NAC inclues ainsi que les labels des contentieux
   */
  validateYML() {
    const message = (document.getElementById('json') as HTMLInputElement);
    this.initialYmlData = parse(message.value).categories

    for (let [key, value] of Object.entries(this.initialYmlData)) {
      let ctx = value as contentieux
      for (let i of ['entrees', 'sorties', 'stock']) {
        // @ts-ignore
        if (ctx.filtres[i] && ctx.filtres[i].NATAFF) {
          // @ts-ignore
          this.distinctNAC = this.distinctNAC.concat(ctx.filtres[i].NATAFF);
          this.distinctNAC = _.uniq(this.distinctNAC)
          this.contentieuxLabelList.push({ code: ctx["Code nomenclature"], name: ctx.label, path: ['filtres', i, 'NATAFF'] })
        }
      }
    }


    this.distinctNAC.map(NAC => { this.pathDictionary = { [NAC]: new Array(), ...this.pathDictionary } })

    for (let [key, value] of Object.entries(this.initialYmlData)) {
      let ctx = value as contentieux
      for (let i of ['entrees', 'sorties', 'stock']) {
        // @ts-ignore
        if (ctx.filtres[i] && ctx.filtres[i].NATAFF) {
          // @ts-ignore
          ctx.filtres[i].NATAFF.map((NAC: any) => {
            // @ts-ignore
            this.pathDictionary[NAC] = [{ NAC, code: ctx["Code nomenclature"], name: ctx.label, path: ['filtres', i, 'NATAFF'] }, ...this.pathDictionary[NAC]]
          })
        }
      }
    }
  }

  /**
   * Sauvegarde de la NAC à ajouter
   * @param event
   */
  onNACToAdd(event: any) {
    this.NACToAdd = event.target.value
  }

  /**
    * S
    * @param change
    */
  onSelectedContentieuxToAddNAC(change: any) {
    this.selectedContentieux = change
  }

  addNAC(arr: Array<any>, nac: string) {
    if (!arr.includes(nac))
      arr.push(nac)
    return arr;
  }

  /**
   * Supprime les valeurs selectionnées et transforme le resultat en YML
   */
  validateAdding() {
    const response = confirm("Etes-vous sur de vouloir effectuer cette action ?");
    if (this.selectedContentieux.length && response) {
      this.displayResult = true
      this.finalYmlData = _.cloneDeep(this.initialYmlData)
      this.selectedContentieux.map((elem: any) => {
        this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF = this.addNAC(this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF, this.NACToAdd)
      })

      const message = (document.getElementById('yml') as HTMLInputElement);
      this.finalYmlData = { categories: this.finalYmlData }
      message.value = stringify(this.finalYmlData)
    }
  }

}
