import { Component, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { parse, stringify } from 'yaml';
import { SelectSimpleComponent } from '../../components/select-simple/select-simple.component';
import { CommonModule } from '@angular/common';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { FormsModule } from '@angular/forms';

interface contentieux {
  label: string;
  'Code nomenclature': string;
  filtres: filtre;
}

interface filtre {
  entrees: filtreDetails;
  sorties: filtreDetails;
  stock: filtreDetails;
}

interface filtreDetails {
  NATAFF?: [];
  C_TUS?: [];
  TOTAL?: string;
}

interface elementToAdd {
  NACToAdd: string;
  code: string;
  name: string;
  path: Array<string>;
}

@Component({
  standalone: true,
  imports: [CommonModule, WrapperComponent, SelectSimpleComponent, FormsModule],
  templateUrl: './yaml-tools.page.html',
  styleUrls: ['./yaml-tools.page.scss'],
})
export class YamlToolsPage {
  @ViewChild('contentieuxSelect') contentieuxSelect:
    | undefined
    | SelectSimpleComponent;
  actionSelection = 0;
  existingNAC: string[] = [];
  distinctNAC: Array<string> = [];
  selectedNACs: Array<string> = [];
  distinctPath: Array<any> = [];
  selectedPath: Array<string> = [];
  countResult = {};
  countResultAfterChange = {};
  pathDictionary: any = {};
  initialYmlData: any = null;
  finalYmlData: any = null;
  textResultValue = '';
  contentieuxLabelList: Array<any> = [];
  tmpNACToAdd: string = '';
  //NACToAdd: Array<string> = []
  selectedContentieuxTmp: Array<elementToAdd> = [];
  selectedContentieux: Array<elementToAdd> = [];
  goToStep3_addNac: boolean = false;
  goToStep4_addNac: boolean = false;
  goToStep5_addNac: boolean = false;
  displayResult: boolean = false;

  /**
   * Initialisation du composant
   */
  init() {
    const ymlArea = document.getElementById('yml') as HTMLInputElement;
    if (ymlArea) ymlArea.value = '';
    const jsonArea = document.getElementById('json') as HTMLInputElement;
    if (jsonArea) jsonArea.value = '';
    const copyButton = document.getElementById('copy') as HTMLInputElement;
    if (copyButton) copyButton.innerText = 'Copier';

    this.existingNAC = [];
    this.distinctNAC = [];
    this.selectedNACs = [];
    this.distinctPath = [];
    this.selectedPath = [];
    this.countResult = {};
    this.countResultAfterChange = {};
    this.pathDictionary = {};
    this.initialYmlData = null;
    this.finalYmlData = null;
    this.textResultValue = '';
    this.actionSelection = 0;
    this.contentieuxLabelList = [];
    this.tmpNACToAdd = '';
    this.selectedContentieuxTmp = [];
    this.selectedContentieux = [];
    this.goToStep3_addNac = false;
    this.goToStep4_addNac = false;
    this.goToStep5_addNac = false;
    this.displayResult = false;
  }

  /**
   * Selection d'une valeur à supprimer
   * @param change
   */
  onSelectedPathChanged(change: any) {
    this.selectedPath = change;
    this.countResult = {};
    this.countResultAfterChange = {};
    this.countResult = this.countNacOccur(change, this.initialYmlData);
  }

  /**
   * Compte le nombre d'occurence d'une NAC selectionnée dans le fichier
   * @param selectedPath
   * @param yamlData
   * @returns
   */
  countNacOccur(selectedPath: Array<string>, yamlData: any) {
    let countResult = {};
    let NacConcerned = selectedPath.map((elem: any) => {
      return elem.NAC;
    });
    NacConcerned = _.uniq(NacConcerned);
    NacConcerned.map((elem: any) => {
      Object.assign(countResult, {
        [elem]: JSON.stringify(yamlData).split(elem).length - 1,
      });
    });
    return countResult;
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
    const response = confirm(
      'Etes-vous sur de vouloir effectuer cette action ?'
    );
    if (this.selectedPath.length && response) {
      this.displayResult = true;
      this.finalYmlData = _.cloneDeep(this.initialYmlData);
      this.selectedPath.map((elem: any) => {
        this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF =
          this.removeAll(
            this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF,
            elem.NAC
          );
      });
      const message = document.getElementById('yml') as HTMLInputElement;
      this.finalYmlData = { categories: this.finalYmlData };
      message.value = stringify(this.finalYmlData);
      this.countResultAfterChange = this.countNacOccur(
        this.selectedPath,
        this.finalYmlData
      );
    }
  }

  /**
   * Creer un dictionnaire de NAC en fonction des NAC selectionnées
   * @param change
   */
  onSelectedChanged(change: any) {
    this.selectedNACs = change;
    this.distinctPath = [];
    // @ts-ignore
    this.selectedNACs.map((NAC) => {
      this.distinctPath = [...this.pathDictionary[NAC], ...this.distinctPath];
    });
  }

  /**
   * Copie le clipboard
   * @param element
   */
  onCopy(element: HTMLElement) {
    const textArea = document.getElementById('yml') as HTMLInputElement;
    navigator.clipboard.writeText(textArea.value);
    element.innerText = 'Copié !';
  }

  /**
   * Réinitialise le bouton copier si le champs est modifié
   * @param element
   */
  onCopyReset(element: HTMLElement) {
    element.innerText = 'Copier';
  }

  /**
   * Transforme le texte YML en Objet et récupère la liste des NAC inclues ainsi que les labels des contentieux
   */
  validateYML() {
    const message = document.getElementById('json') as HTMLInputElement;
    this.initialYmlData = parse(message.value).categories;
    for (let [key, value] of Object.entries(this.initialYmlData)) {
      let ctx = value as contentieux;

      for (let i of ['entrees', 'sorties', 'stock']) {
        // @ts-ignore
        if (
          ctx.filtres !== undefined &&
          ctx.filtres !== null &&
          // @ts-ignore
          ctx.filtres[i] !== undefined
        ) {
          // @ts-ignore
          if (ctx.filtres[i].NATAFF !== undefined) {
            // @ts-ignore
            this.distinctNAC = this.distinctNAC.concat(ctx.filtres[i].NATAFF);
            this.distinctNAC = _.uniq(this.distinctNAC);
            this.distinctNAC = _.sortBy(this.distinctNAC);
          }
          this.contentieuxLabelList.push({
            code: key,
            name: ctx.label,
            path: ['filtres', i, 'NATAFF'],
          });
        }
      }
    }

    this.distinctNAC.map((NAC) => {
      this.pathDictionary = { [NAC]: new Array(), ...this.pathDictionary };
    });

    for (let [key, value] of Object.entries(this.initialYmlData)) {
      let ctx = value as contentieux;
      for (let i of ['entrees', 'sorties', 'stock']) {
        // @ts-ignore
        if (ctx.filtres && ctx.filtres[i] && ctx.filtres[i].NATAFF) {
          // @ts-ignore
          ctx.filtres[i].NATAFF.map((NAC: any) => {
            // @ts-ignore
            this.pathDictionary[NAC] = [
              {
                NAC,
                code: ctx['Code nomenclature'],
                name: ctx.label,
                path: ['filtres', i, 'NATAFF'],
              },
              ...this.pathDictionary[NAC],
            ];
          });
        }
      }
    }
  }

  /**
   * Sauvegarde de la NAC à ajouter
   * @param event
   */
  onNACToAdd(value: string) {
    console.log('tmp_NacToAdd:', this.tmpNACToAdd);
    console.log('NacToAdd:', value);
    //this.NACToAdd.push(value)
    //this.NACToAdd = event.target.value
  }

  /**
   * Sauvegarde dee contentieux dans lesquels ajouter la NAC dans un tableau temporaire
   * @param change
   */
  onSelectedContentieuxToAddNAC(change: any) {
    let tmp = change.map((elem: elementToAdd) => {
      return { ...elem, NACToAdd: this.tmpNACToAdd };
    });
    this.selectedContentieuxTmp = tmp;
    console.log('contentieuxSelect: ', this.contentieuxSelect);
  }

  /**
   *   Copie des contentieux selectionnés pour une NAC dans le tableaux final des NAC à ajouter
   */
  onAddNacValidation() {
    console.log('selectedContentieux_tmp: ', this.selectedContentieuxTmp);
    this.selectedContentieuxTmp.map((elem) => {
      this.selectedContentieux.push(elem);
    });
    this.selectedContentieuxTmp = [];

    if (this.contentieuxSelect) {
      this.contentieuxSelect.selectedRights = [];
    }
    console.log('selectedContentieux : ', this.selectedContentieux);
  }

  /**
   * Ajout de la NAC à la liste des NATAFF d'un contentieux en entree, sortie ou stock
   * @param arr
   * @param nac
   * @returns
   */
  addNAC(arr: Array<any>, nac: string) {
    if (!arr.includes(nac)) arr.push(nac);
    return arr;
  }

  /**
   * Supprime les valeurs selectionnées et transforme le resultat en YML
   */
  validateAdding() {
    const response = confirm(
      'Etes-vous sur de vouloir effectuer cette action ?'
    );
    if (this.selectedContentieux.length && response) {
      this.displayResult = true;
      this.finalYmlData = _.cloneDeep(this.initialYmlData);

      this.selectedContentieux.map((elem: any) => {
        if (
          this.finalYmlData[elem.code].filtres[elem.path[1]] &&
          this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF ===
            undefined
        )
          this.finalYmlData[elem.code].filtres[elem.path[1]] = {
            NATAFF: [],
            ...this.finalYmlData[elem.code].filtres[elem.path[1]],
          };
        this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF = this.addNAC(
          this.finalYmlData[elem.code].filtres[elem.path[1]].NATAFF,
          elem.NACToAdd
        );
      });

      const message = document.getElementById('yml') as HTMLInputElement;
      this.finalYmlData = { categories: this.finalYmlData };
      message.value = stringify(this.finalYmlData);
    }
  }
}
