import { Component } from '@angular/core';
import * as _ from 'lodash';
import { BackupInterface } from 'src/app/interfaces/backup';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { ImportService } from 'src/app/services/import/import.service';
import { exportFileToString } from 'src/app/utils/file';

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
  templateUrl: './imports.page.html',
  styleUrls: ['./imports.page.scss'],
})
export class ImportsPage {
  HRBackupList: BackupInterface[] = [];
  existingNAC: string[] = []
  distinctNAC: Array<string> = []
  selectedNACs: Array<string> = []

  constructor(
    private importService: ImportService,
    private humanResourceService: HumanResourceService
  ) { }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    document.getElementById("json")!.textContent = JSON.stringify(data, undefined, 2);
    const ymlData = data.categories

    for (let [key, value] of Object.entries(ymlData)) {
      let ctx = value as contentieux

      if (ctx.filtres.entrees && ctx.filtres.entrees.NATAFF) {
        this.distinctNAC = this.distinctNAC.concat(ctx.filtres.entrees.NATAFF);
        this.distinctNAC = _.uniq(this.distinctNAC)
      }
      if (ctx.filtres.sorties && ctx.filtres.sorties.NATAFF) {
        this.distinctNAC = this.distinctNAC.concat(ctx.filtres.sorties.NATAFF);
        this.distinctNAC = _.uniq(this.distinctNAC)
      }
      if (ctx.filtres.stock && ctx.filtres.stock.NATAFF) {
        this.distinctNAC = this.distinctNAC.concat(ctx.filtres.stock.NATAFF);
        this.distinctNAC = _.uniq(this.distinctNAC)
      }

    }
    /**
     * console.log(`key=${key} value=${JSON.stringify(value, undefined, 2)}`)
    console.log(`key=${key} value=${value.filtres}`)

    
    if (value.filtres.entrees) value.filtres.entrees.NATAFF
    if (value.filtres.sorties) null
    // @ts-ignore
    if (value.filtres.stock) null
    */
    //document.getElementById("res-json")!.textContent = JSON.stringify(_.countBy(data, function (data) { return data; }), undefined, 2);



    this.humanResourceService
      .getBackupList()
      .then((r) => (this.HRBackupList = r));
  }

  onChangeBackup(event: any) {

  }

  async onSendReferentiel(refDom: any) {
    if (refDom.files.length === 0) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    if (!confirm('Confirmer la modification du référentiel ?')) {
      return;
    }

    this.importService
      .importReferentiel(await exportFileToString(refDom.files[0]))
      .then((url) => {
        refDom.value = '';
        // @ts-ignore
        window.open(url, '_blank').focus();
      });
  }

  async onSendHR(form: any) {
    const file = form.file.files[0];

    if (!file) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    const options = {
      file: await exportFileToString(file),
    };

    this.importService.importHR(options).then(() => {
      alert('OK !');
      form.reset();
      this.onLoad();
    });
  }

  async onSendActivity(form: any) {
    const backupId = form.backupId.value;
    const file = form.file.files[0];

    if (!file) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    this.importService
      .importActivities({ file: await exportFileToString(file), backupId })
      .then(() => {
        alert('OK !');
        form.reset();
      });
  }

  async onSendAllActivity(form: any) {
    const file = form.file.files[0];

    if (!file) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    this.importService
      .importAllActivities({ file: await exportFileToString(file) })
      .then(() => {
        alert('OK !');
        form.reset();
      });
  }


}


const data = {
  "categories": {
    "1.1.": {
      "label": "1.1. Contentieux du travail",
      "Code nomenclature": "1.1.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "80A",
            "80B",
            "80C",
            "80D",
            "80E",
            "80F",
            "80G",
            "80H",
            "80I",
            "80J",
            "80K",
            "80L",
            "80M",
            "80N",
            "80O",
            "80P",
            "80Q",
            "80R",
            "80S",
            "80T",
            "80U",
            "80V",
            "80W",
            "80X",
            "80Y",
            "81A",
            "81B",
            "81C",
            "81D",
            "81E",
            "81F",
            "81G",
            "81H",
            "81I",
            "81J",
            "81K",
            "82A",
            "82B",
            "82C",
            "82D",
            "82E",
            "82F",
            "82G",
            "82H",
            "82I",
            "82J",
            "82K",
            "83A",
            "83B",
            "83C",
            "83D",
            "83E",
            "83F",
            "83G",
            "83H",
            "83I",
            "84A",
            "84B",
            "84C",
            "84D",
            "84E",
            "84F",
            "84G",
            "84H",
            "84I",
            "84J",
            "84K",
            "84L",
            "84M",
            "84N",
            "85A",
            "85B",
            "85C",
            "85D",
            "86A",
            "86B",
            "86C",
            "86D",
            "86E",
            "86F",
            "86G",
            "87A",
            "87B",
            "87C",
            "87D",
            "87E",
            "87F",
            "87X"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "80A",
            "80B",
            "80C",
            "80D",
            "80E",
            "80F",
            "80G",
            "80H",
            "80I",
            "80J",
            "80K",
            "80L",
            "80M",
            "80N",
            "80O",
            "80P",
            "80Q",
            "80R",
            "80S",
            "80T",
            "80U",
            "80V",
            "80W",
            "80X",
            "80Y",
            "81A",
            "81B",
            "81C",
            "81D",
            "81E",
            "81F",
            "81G",
            "81H",
            "81I",
            "81J",
            "81K",
            "82A",
            "82B",
            "82C",
            "82D",
            "82E",
            "82F",
            "82G",
            "82H",
            "82I",
            "82J",
            "82K",
            "83A",
            "83B",
            "83C",
            "83D",
            "83E",
            "83F",
            "83G",
            "83H",
            "83I",
            "84A",
            "84B",
            "84C",
            "84D",
            "84E",
            "84F",
            "84G",
            "84H",
            "84I",
            "84J",
            "84K",
            "84L",
            "84M",
            "84N",
            "85A",
            "85B",
            "85C",
            "85D",
            "86A",
            "86B",
            "86C",
            "86D",
            "86E",
            "86F",
            "86G",
            "87A",
            "87B",
            "87C",
            "87D",
            "87E",
            "87F",
            "87X"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "80A",
            "80B",
            "80C",
            "80D",
            "80E",
            "80F",
            "80G",
            "80H",
            "80I",
            "80J",
            "80K",
            "80L",
            "80M",
            "80N",
            "80O",
            "80P",
            "80Q",
            "80R",
            "80S",
            "80T",
            "80U",
            "80V",
            "80W",
            "80X",
            "80Y",
            "81A",
            "81B",
            "81C",
            "81D",
            "81E",
            "81F",
            "81G",
            "81H",
            "81I",
            "81J",
            "81K",
            "82A",
            "82B",
            "82C",
            "82D",
            "82E",
            "82F",
            "82G",
            "82H",
            "82I",
            "82J",
            "82K",
            "83A",
            "83B",
            "83C",
            "83D",
            "83E",
            "83F",
            "83G",
            "83H",
            "83I",
            "84A",
            "84B",
            "84C",
            "84D",
            "84E",
            "84F",
            "84G",
            "84H",
            "84I",
            "84J",
            "84K",
            "84L",
            "84M",
            "84N",
            "85A",
            "85B",
            "85C",
            "85D",
            "86A",
            "86B",
            "86C",
            "86D",
            "86E",
            "86F",
            "86G",
            "87A",
            "87B",
            "87C",
            "87D",
            "87E",
            "87F",
            "87X"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "1.2.": {
      "label": "1.2. Contentieux de la protection sociale",
      "Code nomenclature": "1.2.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "88A",
            "88B",
            "88C",
            "88D",
            "88E",
            "88F",
            "88G",
            "88H",
            "88I",
            "88J",
            "88K",
            "88L",
            "88M",
            "88N",
            "88O",
            "88P",
            "88Q",
            "88R",
            "88S",
            "88T",
            "88U",
            "88V",
            "88W",
            "88Y",
            "89A",
            "89B",
            "89C",
            "89D",
            "89E",
            "89F",
            "89G",
            "89H",
            "89I",
            "89J",
            "89K",
            "89L",
            "89M",
            "89N",
            "89O",
            "89P",
            "89Q",
            "89R",
            "89Z"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "88A",
            "88B",
            "88C",
            "88D",
            "88E",
            "88F",
            "88G",
            "88H",
            "88I",
            "88J",
            "88K",
            "88L",
            "88M",
            "88N",
            "88O",
            "88P",
            "88Q",
            "88R",
            "88S",
            "88T",
            "88U",
            "88V",
            "88W",
            "88Y",
            "89A",
            "89B",
            "89C",
            "89D",
            "89E",
            "89F",
            "89G",
            "89H",
            "89I",
            "89J",
            "89K",
            "89L",
            "89M",
            "89N",
            "89O",
            "89P",
            "89Q",
            "89R",
            "89Z"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "88A",
            "88B",
            "88C",
            "88D",
            "88E",
            "88F",
            "88G",
            "88H",
            "88I",
            "88J",
            "88K",
            "88L",
            "88M",
            "88N",
            "88O",
            "88P",
            "88Q",
            "88R",
            "88S",
            "88T",
            "88U",
            "88V",
            "88W",
            "88Y",
            "89A",
            "89B",
            "89C",
            "89D",
            "89E",
            "89F",
            "89G",
            "89H",
            "89I",
            "89J",
            "89K",
            "89L",
            "89M",
            "89N",
            "89O",
            "89P",
            "89Q",
            "89R",
            "89Z"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Ventes",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "1.3.": {
      "label": "1.3. Référés",
      "Code nomenclature": "1.3.",
      "filtres": {
        "entrees": {
          "C_TUS": [
            "A. T. TGI : Référés"
          ],
          "AUTDJU": [
            "Juge du pôle social"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": [
            "A. T. TGI : Référés"
          ],
          "AUTDJU": [
            "Juge du pôle social"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": 0
      }
    },
    "1.4.": {
      "label": "1.4. Autres contentieux sociaux",
      "Code nomenclature": "1.4.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge du pôle social"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "00A"
          ],
          "AUTDJU": "Juge du pôle social",
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge du pôle social"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.1.": {
      "label": "2.1. Mariages et régimes matrimoniaux",
      "Code nomenclature": "2.1.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "23C",
            "23D",
            "23E",
            "23F",
            "23G",
            "23H",
            "23Z"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "23C",
            "23D",
            "23E",
            "23F",
            "23G",
            "23H",
            "23Z"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "23C",
            "23D",
            "23E",
            "23F",
            "23G",
            "23H",
            "23Z"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock Tribunal des pensions militaires",
            "Stock Commission rogatoire",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.2.": {
      "label": "2.2. Divorce - contentieux",
      "Code nomenclature": "2.2.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "20F",
            "20G",
            "20J",
            "20L",
            "20X"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "20F",
            "20G",
            "20J",
            "20L",
            "20X"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "20F",
            "20G",
            "20J",
            "20L",
            "20X"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock Tribunal des pensions militaires",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.3.": {
      "label": "2.3. Après et hors divorce",
      "Code nomenclature": "2.3.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "12B",
            "12C",
            "22A",
            "22B",
            "22C",
            "22D",
            "22E",
            "22F"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "12B",
            "12C",
            "22A",
            "22B",
            "22C",
            "22D",
            "22E",
            "22F"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "12B",
            "12C",
            "22A",
            "22B",
            "22C",
            "22D",
            "22E",
            "22F"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock Tribunal des pensions militaires",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.4.": {
      "label": "2.4. Liquidation partage",
      "Code nomenclature": "2.4.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "22G"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "22G"
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "22G"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock Tribunal des pensions militaires",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.5.": {
      "label": "2.5. Autorité parentale",
      "Code nomenclature": "2.5.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "27A",
            "27B",
            "27C",
            "27D",
            "27E",
            "27F",
            "27I",
            "27J",
            "27K",
            "27L",
            "27Z"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : accidents de travail agricoles",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "27A",
            "27B",
            "27C",
            "27D",
            "27E",
            "27F",
            "27I",
            "27J",
            "27K",
            "27L",
            "27Z"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "27A",
            "27B",
            "27C",
            "27D",
            "27E",
            "27F",
            "27I",
            "27J",
            "27K",
            "27L",
            "27Z"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock  Accidents du travail agricole des non salariés",
            "Stock Tribunal des pensions militaires",
            "Stock Commission rogatoire",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.6.": {
      "label": "2.6. Obligations à caractère alimentaire",
      "Code nomenclature": "2.6.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "24A",
            "24B",
            "24C",
            "24D",
            "24E",
            "24F",
            "24G",
            "24I",
            "24J",
            "24K",
            "24L",
            "24M",
            "24N",
            "24Z"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : accidents de travail agricoles",
            "A. N. TGI : juge des libertés et de la détention",
            "Contentieux général-affaires nouvelles",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "24A",
            "24B",
            "24C",
            "24D",
            "24E",
            "24F",
            "24G",
            "24I",
            "24J",
            "24K",
            "24L",
            "24M",
            "24N",
            "24Z"
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Contentieux général hors divorce",
            "Contentieux général-affaires terminées",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "24A",
            "24B",
            "24C",
            "24D",
            "24E",
            "24F",
            "24G",
            "24I",
            "24J",
            "24K",
            "24L",
            "24M",
            "24N",
            "24Z"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock  Accidents du travail agricole des non salariés",
            "Stock Tribunal des pensions militaires",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.8.": {
      "label": "2.8. Référés et mesures urgentes",
      "Code nomenclature": "2.8.",
      "filtres": {
        "entrees": {
          "C_TUS": [
            "A. T. TGI : Référés"
          ],
          "AUTDJU": [
            "Juge des affaires familiales statuant en référé (art. 1074-3 du NCPC)",
            "Juge des affaires familiales"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": [
            "A. T. TGI : Référés"
          ],
          "AUTDJU": [
            "Juge des affaires familiales statuant en référé (art. 1074-3 du NCPC)",
            "Juge des affaires familiales"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": 0
      }
    },
    "2.8.00.": {
      "label": "2.8. Référés et mesures urgentes - Ordonnances de protection COPRO",
      "Code nomenclature": "2.8.",
      "filtres": {
        "entrees": {
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "COPRO": [
            "Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.",
            "Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.",
            "Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement",
            "Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement",
            "Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement",
            "Demande de modification de la mesure de bracelet anti-rapprochement",
            "Demande de mainlevée de la mesure de bracelet anti-rapprochement",
            "Demande de renouvellement de la mesure de bracelet anti-rapprochement"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Ordonnances rendues sur requêtes"
          ],
          "COPRO": [
            "Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.",
            "Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.",
            "Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement",
            "Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement",
            "Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement",
            "Demande de modification de la mesure de bracelet anti-rapprochement",
            "Demande de mainlevée de la mesure de bracelet anti-rapprochement",
            "Demande de renouvellement de la mesure de bracelet anti-rapprochement"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "C_TUS": [
            "Stock Contentieux général"
          ],
          "COPRO": [
            "Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.",
            "Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.",
            "Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement",
            "Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement",
            "Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement",
            "Demande de modification de la mesure de bracelet anti-rapprochement",
            "Demande de mainlevée de la mesure de bracelet anti-rapprochement",
            "Demande de renouvellement de la mesure de bracelet anti-rapprochement"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.9.": {
      "label": "2.9. Autres JAF",
      "Code nomenclature": "2.9.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "12A",
            "12D",
            "12Z",
            "20A",
            "20B",
            "20C",
            "20D",
            "20E",
            "20I",
            "20K",
            "21A",
            "21B",
            "21C",
            "21F",
            "21G",
            "21H",
            "21I",
            "21J",
            "21K",
            "21X"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : accidents de travail agricoles",
            "A. N. TGI : juge des libertés et de la détention",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "12A",
            "12D",
            "12Z",
            "20A",
            "20B",
            "20C",
            "20D",
            "20E",
            "20I",
            "20K",
            "21A",
            "21B",
            "21C",
            "21F",
            "21G",
            "21H",
            "21I",
            "21J",
            "21K",
            "21X"
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "12A",
            "12D",
            "12Z",
            "20A",
            "20B",
            "20C",
            "20D",
            "20E",
            "20I",
            "20K",
            "21A",
            "21B",
            "21C",
            "21F",
            "21G",
            "21H",
            "21I",
            "21J",
            "21K",
            "21X"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Divorce, séparation de corps, conversion",
            "Stock  Accidents du travail agricole des non salariés",
            "Stock Tribunal des pensions militaires",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "2.9.00.": {
      "label": "2.9. Autres JAF 00A",
      "Code nomenclature": "2.9.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge des affaires familiales",
            "Juge des affaires familiales saisi en référé"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : divorce, séparation de corps, conversion",
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "00A"
          ],
          "AUTDJU": [
            "Juge des affaires familiales",
            "Juge des affaires familiales statuant sur requête (art. 220-1 et 257 du Code civil)",
            "Juge des affaires familiales statuant en référé (art. 1074-3 du NCPC)"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "A. T. TGI : Divorce, séparation de corps, conversion",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge des affaires familiales",
            "Juge des affaires familiales saisi sur requête"
          ],
          "COPRO": [
            "<> \"Demande d'ordonnance de protection dans le cadre de violences Art.515-9 et suivants c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de menace de mariage forcé Art.515-13 c.civ.\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences avec demande de bracelet anti-rapprochement\"",
            "<> \"Demande d'ordonnance de protection dans le cadre de violences sans demande de bracelet anti-rapprochement\"",
            "<> \"Demande de modification, renouvellement ou suppression des mesures énoncées dans une ordonnance de protection - autres mesures que le bracelet anti-rapprochement\"",
            "<> \"Demande de modification de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de mainlevée de la mesure de bracelet anti-rapprochement\"",
            "<> \"Demande de renouvellement de la mesure de bracelet anti-rapprochement\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "3.2.": {
      "label": "3.2. Protection des majeurs",
      "Code nomenclature": "3.2.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "18B",
            "PP",
            "17K",
            "17L",
            "17N",
            "17O",
            "17D",
            "16F",
            "16C",
            "16Q",
            "16P",
            "11G",
            "23E",
            "17J",
            "17E",
            "16B",
            "16E",
            "18A",
            "17P",
            "18E",
            "23D",
            "17T",
            "16R",
            "17Q",
            "16S",
            "16D",
            "17M",
            "16M",
            "16O",
            "18Z",
            "00A",
            "16N",
            "13C",
            "16J",
            "16H",
            "16G",
            "18H",
            "17I",
            "18F",
            "28Z",
            "17H"
          ],
          "C_TUS": [
            "AN tutelles majeurs - dossier ponctuel",
            "AN tutelles majeurs - dossier permanent"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "18B",
            "PP",
            "17K",
            "17L",
            "17N",
            "17O",
            "17D",
            "16F",
            "16C",
            "16Q",
            "16P",
            "11G",
            "23E",
            "17J",
            "17E",
            "16B",
            "16E",
            "18A",
            "17P",
            "18E",
            "23D",
            "17T",
            "16R",
            "17Q",
            "16S",
            "16D",
            "17M",
            "16M",
            "16O",
            "18Z",
            "00A",
            "16N",
            "13C",
            "16J",
            "16H",
            "16G",
            "18H",
            "17I",
            "18F",
            "28Z",
            "17H"
          ],
          "C_TUS": [
            "AT tutelles majeurs - dossier ponctuel",
            "AT tutelles majeurs - dossier permanent"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "18B",
            "PP",
            "17K",
            "17L",
            "17N",
            "17O",
            "17D",
            "16F",
            "16C",
            "16Q",
            "16P",
            "11G",
            "23E",
            "17J",
            "17E",
            "16B",
            "16E",
            "18A",
            "17P",
            "18E",
            "23D",
            "17T",
            "16R",
            "17Q",
            "16S",
            "16D",
            "17M",
            "16M",
            "16O",
            "18Z",
            "00A",
            "16N",
            "13C",
            "16J",
            "16H",
            "16G",
            "18H",
            "17I",
            "18F",
            "28Z",
            "17H"
          ],
          "C_TUS": [
            "Stock Tutelles Majeurs Ponctuelles",
            "Stock Tutelles Majeurs Dossiers"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "3.3.": {
      "label": "3.3. Surendettement des particuliers",
      "Code nomenclature": "3.3.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "48A",
            "48B",
            "48C",
            "48D",
            "48E",
            "48F",
            "48G",
            "48H",
            "48I",
            "48J",
            "48K",
            "48L",
            "48M",
            "48N",
            "48O",
            "48P",
            "48Q",
            "48R",
            "48X"
          ],
          "C_TUS": [
            "Contentieux général-affaires nouvelles",
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : redressements et liquidations judiciaires"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "48A",
            "48B",
            "48C",
            "48D",
            "48E",
            "48F",
            "48G",
            "48H",
            "48I",
            "48J",
            "48K",
            "48L",
            "48M",
            "48N",
            "48O",
            "48P",
            "48Q",
            "48R",
            "48X"
          ],
          "C_TUS": [
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "48A",
            "48B",
            "48C",
            "48D",
            "48E",
            "48F",
            "48G",
            "48H",
            "48I",
            "48J",
            "48K",
            "48L",
            "48M",
            "48N",
            "48O",
            "48P",
            "48Q",
            "48Q",
            "48R",
            "48X"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Conciliation, Sauvegarde, Redressements et liquidations judiciaires",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "3.41.": {
      "label": "3.41. Baux",
      "Code nomenclature": "3.41.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "51A",
            "51B",
            "51C",
            "51D",
            "51E",
            "51F",
            "51G",
            "51H",
            "51I",
            "51J",
            "51K",
            "51L",
            "51M",
            "51Z",
            "5AA",
            "5AB",
            "5AC",
            "5AD",
            "5AE",
            "5AF",
            "5AG",
            "5AH",
            "5AI",
            "5AJ",
            "5AK",
            "5AL",
            "5AM",
            "5AZ",
            "5BA",
            "5BB",
            "5BC",
            "5BD",
            "5BE",
            "5BF",
            "5BG",
            "5BH",
            "5BI",
            "5BZ",
            "52A",
            "52B",
            "52C",
            "52D",
            "52E",
            "52F",
            "52G",
            "52Z"
          ],
          "AUTSAI": [
            "<> \"Juge de l'exécution\"",
            "<> \"Juge de l'exécution saisi sur requête\""
          ],
          "C_TUS": [
            "Contentieux général-affaires nouvelles",
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général Tribunal paritaire des baux ruraux-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "51A",
            "51B",
            "51C",
            "51D",
            "51E",
            "51F",
            "51G",
            "51H",
            "51I",
            "51J",
            "51K",
            "51L",
            "51M",
            "51Z",
            "5AA",
            "5AB",
            "5AC",
            "5AD",
            "5AE",
            "5AF",
            "5AG",
            "5AH",
            "5AI",
            "5AJ",
            "5AK",
            "5AL",
            "5AM",
            "5AZ",
            "5BA",
            "5BB",
            "5BC",
            "5BD",
            "5BE",
            "5BF",
            "5BG",
            "5BH",
            "5BI",
            "5BZ",
            "52A",
            "52B",
            "52C",
            "52D",
            "52E",
            "52F",
            "52G",
            "52Z"
          ],
          "AUTDJU": [
            "<> \"Juge de l'exécution\"",
            "<> \"Juge de l'exécution saisi sur requête\""
          ],
          "C_TUS": [
            "Contentieux général-affaires terminées",
            "Contentieux général Tribunal paritaire des baux ruraux-affaires terminées",
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "51A",
            "51B",
            "51C",
            "51D",
            "51E",
            "51F",
            "51G",
            "51H",
            "51I",
            "51J",
            "51K",
            "51L",
            "51M",
            "51Z",
            "5AA",
            "5AB",
            "5AC",
            "5AD",
            "5AE",
            "5AF",
            "5AG",
            "5AH",
            "5AI",
            "5AJ",
            "5AK",
            "5AL",
            "5AM",
            "5AZ",
            "5BA",
            "5BB",
            "5BC",
            "5BD",
            "5BE",
            "5BF",
            "5BG",
            "5BH",
            "5BI",
            "5BZ",
            "52A",
            "52B",
            "52C",
            "52D",
            "52E",
            "52F",
            "52G",
            "52Z"
          ],
          "AUTSAI": [
            "<> \"Président du TJ ou son délégué saisi en référé\"",
            "<> \"Président du TGI ou son délégué saisi en référé (art.808 à 811 du NCPC)\"",
            "<> \"Juge de l'exécution\"",
            "<> \"Juge de l'exécution saisi sur requête\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock  Juge des libertés et de la détention",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "3.42.": {
      "label": "3.42. Crédit à la consommation",
      "Code nomenclature": "3.42.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "53B",
            "53E",
            "53F",
            "53H",
            "53I",
            "53J",
            "53L"
          ],
          "COPRO": [
            "<> \"Opposition à injonction de payer\""
          ],
          "C_TUS": [
            "Contentieux général-affaires nouvelles",
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "53B",
            "53E",
            "53F",
            "53H",
            "53I",
            "53J",
            "53L"
          ],
          "COPRO": [
            "<> \"Opposition à injonction de payer\""
          ],
          "C_TUS": [
            "Contentieux général-affaires terminées",
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "53B",
            "53E",
            "53F",
            "53H",
            "53I",
            "53J",
            "53L"
          ],
          "COPRO": [
            "<> \"Opposition à injonction de payer\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock  Juge des libertés et de la détention",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "3.43.": {
      "label": "3.43. Injonctions de payer",
      "Code nomenclature": "3.43.",
      "filtres": {
        "entrees": {
          "C_TUS": "TI - Affaires nouvelles - Saisines injonction de payer",
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": "TI - Affaires terminées - Ordonnances d'injonction de payer",
          "TOTAL": "NBAFF"
        }
      }
    },
    "3.43.00.": {
      "label": "3.43. Injonctions de payer COPRO",
      "Code nomenclature": "3.43.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "53B",
            "53D",
            "53E",
            "53F",
            "53H",
            "53I",
            "53J",
            "53L"
          ],
          "COPRO": [
            "Opposition à injonction de payer"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "53B",
            "53D",
            "53E",
            "53F",
            "53H",
            "53I",
            "53J",
            "53L"
          ],
          "COPRO": [
            "Opposition à injonction de payer"
          ],
          "C_TUS": [
            "Contentieux général-affaires terminées",
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "53B",
            "53D",
            "53E",
            "53F",
            "53H",
            "53I",
            "53J",
            "53L"
          ],
          "COPRO": [
            "Opposition à injonction de payer"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock  Juge des libertés et de la détention",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "3.44.": {
      "label": "3.44. Saisie des rémunérations",
      "Code nomenclature": "3.44.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "78H"
          ],
          "C_TUS": [
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "78H"
          ],
          "C_TUS": [
            "Contentieux général-affaires terminées"
          ]
        }
      }
    },
    "3.5.": {
      "label": "3.5. Référés",
      "Code nomenclature": "3.5.",
      "filtres": {
        "entrees": {
          "C_TUS": [
            "Référés terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": [
            "Référés terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": 0
      }
    },
    "4.1.": {
      "label": "4.1. Droit des personnes",
      "Code nomenclature": "4.1.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "10A",
            "10B",
            "10C",
            "10Z",
            "11A",
            "11B",
            "11C",
            "11D",
            "11E",
            "11F",
            "11G",
            "11Z",
            "13A",
            "13B",
            "13C",
            "13D",
            "13E",
            "13Z",
            "14F",
            "14A",
            "14B",
            "14D",
            "14E",
            "14X"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "10A",
            "10B",
            "10C",
            "10Z",
            "11A",
            "11B",
            "11C",
            "11D",
            "11E",
            "11F",
            "11G",
            "11Z",
            "13A",
            "13B",
            "13C",
            "13D",
            "13E",
            "13Z",
            "14F",
            "14A",
            "14B",
            "14D",
            "14E",
            "14X"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "10A",
            "10B",
            "10C",
            "10Z",
            "11A",
            "11B",
            "11C",
            "11D",
            "11E",
            "11F",
            "11G",
            "11Z",
            "13A",
            "13B",
            "13C",
            "13D",
            "13E",
            "13Z",
            "14F",
            "14A",
            "14B",
            "14D",
            "14E",
            "14X"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.10.": {
      "label": "4.10. Propriété industrielle",
      "Code nomenclature": "4.10.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "39A",
            "39B",
            "39C",
            "39F",
            "39G",
            "39H",
            "39I",
            "39J",
            "39K",
            "39L",
            "39M",
            "39X",
            "39Z",
            "3AA",
            "3AB",
            "3AC",
            "3AD",
            "3AE",
            "3AF",
            "3AG",
            "3AH",
            "3AI",
            "3AZ",
            "3BA",
            "3BB",
            "3BC",
            "3BD",
            "3BE",
            "3BF",
            "3BZ",
            "3CA",
            "3CB",
            "3CC",
            "3CD",
            "3CE",
            "3CF",
            "3CZ",
            "3DA",
            "3DZ",
            "3EA",
            "3EB",
            "3EC",
            "3ED",
            "3EE",
            "3EF",
            "3EZ"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "39A",
            "39B",
            "39C",
            "39F",
            "39G",
            "39H",
            "39I",
            "39J",
            "39K",
            "39L",
            "39M",
            "39X",
            "39Z",
            "3AA",
            "3AB",
            "3AC",
            "3AD",
            "3AE",
            "3AF",
            "3AG",
            "3AH",
            "3AI",
            "3AZ",
            "3BA",
            "3BB",
            "3BC",
            "3BD",
            "3BE",
            "3BF",
            "3BZ",
            "3CA",
            "3CB",
            "3CC",
            "3CD",
            "3CE",
            "3CF",
            "3CZ",
            "3DA",
            "3DZ",
            "3EA",
            "3EB",
            "3EC",
            "3ED",
            "3EE",
            "3EF",
            "3EZ"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "39A",
            "39B",
            "39C",
            "39F",
            "39G",
            "39H",
            "39I",
            "39J",
            "39K",
            "39L",
            "39M",
            "39X",
            "39Z",
            "3AA",
            "3AB",
            "3AC",
            "3AD",
            "3AE",
            "3AF",
            "3AG",
            "3AH",
            "3AI",
            "3AZ",
            "3BA",
            "3BB",
            "3BC",
            "3BD",
            "3BE",
            "3BF",
            "3BZ",
            "3CA",
            "3CB",
            "3CC",
            "3CD",
            "3CE",
            "3CF",
            "3CZ",
            "3DA",
            "3DZ",
            "3EA",
            "3EB",
            "3EC",
            "3ED",
            "3EE",
            "3EF",
            "3EZ"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.11.": {
      "label": "4.11. Propriété littéraire et artistique",
      "Code nomenclature": "4.11.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "79A",
            "79B",
            "79C",
            "79D",
            "79E",
            "79F",
            "79Z"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "79A",
            "79B",
            "79C",
            "79D",
            "79E",
            "79F",
            "79Z"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "79A",
            "79B",
            "79C",
            "79D",
            "79E",
            "79F",
            "79Z"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.12.": {
      "label": "4.12. Suivi des expertises",
      "Code nomenclature": "4.12.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "6A",
            "70L",
            "70M"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "6A",
            "70L",
            "70M"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "6A",
            "70L",
            "70M"
          ],
          "C_TUS": [
            "Stock Contentieux général"
          ]
        }
      }
    },
    "4.13.": {
      "label": "4.13. Affaires gracieuses",
      "Code nomenclature": "4.13.",
      "filtres": {
        "entrees": {
          "AUTSAI": [
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge des affaires familiales saisi sur requête\""
          ],
          "C_TUS": [
            "A. N. TGI : affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "AUTSAI": [
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge des affaires familiales saisi sur requête\""
          ],
          "C_TUS": [
            "A. T. TGI : Affaires gracieuses hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "AUTSAI": [
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge des affaires familiales saisi sur requête\""
          ],
          "C_TUS": [
            "Stock  Gracieux"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.14.": {
      "label": "4.14. Juridiction du président",
      "Code nomenclature": "4.14.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "70N",
            "70O"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "70N",
            "70O"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "70N",
            "70O"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.15.": {
      "label": "4.15. CIVI",
      "Code nomenclature": "4.15.",
      "filtres": {
        "entrees": {
          "AUTSAI": [
            "Commission d'indemnisation des victimes de dommages résultant d'une infraction (CIVI)",
            "Tribunal des pensions militaires"
          ],
          "C_TUS": [
            "A. N. TGI : accidents de travail agricoles",
            "A. N. TGI : CIVI"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": [
            "A. T. TGI : CIVI"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "C_TUS": [
            "Stock CIVI (commission d'Indemnisation des Victimes d'Infractions)"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.16.": {
      "label": "4.16. Référés civils",
      "Code nomenclature": "4.16.",
      "filtres": {
        "entrees": {
          "C_TUS": [
            "A. T. TGI : Référés"
          ],
          "AUTDJU": [
            "<> \"Juge des affaires familiales statuant en référé (art. 1074-3 du NCPC)\"",
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge du pôle social\""
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "C_TUS": [
            "A. T. TGI : Référés"
          ],
          "AUTDJU": [
            "<> \"Juge des affaires familiales statuant en référé (art. 1074-3 du NCPC)\"",
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge du pôle social\""
          ],
          "TOTAL": "NBAFF"
        },
        "stock": 0
      }
    },
    "4.16.00.": {
      "label": "4.16. Référés civils - NAC 5B",
      "Code nomenclature": "4.16.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "5B"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "5B"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": 0
      }
    },
    "4.17.": {
      "label": "4.17. Autres civil NS",
      "Code nomenclature": "4.17.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "00A",
            "90A",
            "90B",
            "90C",
            "90D",
            "90Z",
            "91A",
            "91B",
            "91C",
            "91D",
            "91Z",
            "92A",
            "92B",
            "92C",
            "92D",
            "92Z",
            "93A",
            "93B",
            "94A",
            "94B",
            "94C",
            "94D",
            "94Z",
            "95A",
            "95B",
            "95C",
            "96A",
            "96B",
            "96C",
            "96D",
            "96E",
            "96Z",
            "97A",
            "97B",
            "97C",
            "97D",
            "97E",
            "97F",
            "97G",
            "97H",
            "97J",
            "97K",
            "97L",
            "97M",
            "97N",
            "97O",
            "97P",
            "97Z",
            "9J",
            "9N",
            "3C"
          ],
          "AUTSAI": [
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge des affaires familiales saisi sur requête\"",
            "<> \"Juge des affaires familiales saisi en référé\"",
            "<> \"Juge de l'exécution\"",
            "<> \"Juge de l'exécution saisi sur requête\"",
            "<> \"Juge des libertés et de la détention\"",
            "<> \"Juge du pôle social\""
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : redressements et liquidations judiciaires",
            "A. N. TGI : commissions rogatoires",
            "A. N. TGI : règlements amiables agricoles, SCI, associations",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "00A",
            "90A",
            "90B",
            "90C",
            "90D",
            "90Z",
            "91A",
            "91B",
            "91C",
            "91D",
            "91Z",
            "92A",
            "92B",
            "92C",
            "92D",
            "92Z",
            "93A",
            "93B",
            "94A",
            "94B",
            "94C",
            "94D",
            "94Z",
            "95A",
            "95B",
            "95C",
            "96A",
            "96B",
            "96C",
            "96D",
            "96E",
            "96Z",
            "97A",
            "97B",
            "97C",
            "97D",
            "97E",
            "97F",
            "97G",
            "97H",
            "97J",
            "97K",
            "97L",
            "97M",
            "97N",
            "97O",
            "97P",
            "97Z",
            "9J",
            "9N",
            "3C"
          ],
          "AUTDJU": [
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge des affaires familiales statuant en référé (art. 1074-3 du NCPC)\"",
            "<> \"Juge de l'exécution\"",
            "<> \"Juge de l'exécution statuant sur requête\"",
            "<> \"Juge du pôle social\""
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Redressements et liquidations judiciaires",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "00A",
            "90A",
            "90B",
            "90C",
            "90D",
            "90Z",
            "91A",
            "91B",
            "91C",
            "91D",
            "91Z",
            "92A",
            "92B",
            "92C",
            "92D",
            "92Z",
            "93A",
            "93B",
            "94A",
            "94B",
            "94C",
            "94D",
            "94Z",
            "95A",
            "95B",
            "95C",
            "96A",
            "96B",
            "96C",
            "96D",
            "96E",
            "96Z",
            "97A",
            "97B",
            "97C",
            "97D",
            "97E",
            "97F",
            "97G",
            "97H",
            "97J",
            "97K",
            "97L",
            "97M",
            "97N",
            "97O",
            "97P",
            "97Z",
            "9J",
            "9N",
            "3C"
          ],
          "AUTSAI": [
            "<> \"Juge des affaires familiales\"",
            "<> \"Juge des affaires familiales saisi sur requête\"",
            "<> \"Juge des affaires familiales saisi en référé\"",
            "<> \"Juge de l'exécution\"",
            "<> \"Juge de l'exécution saisi sur requête\"",
            "<> \"Juge des libertés et de la détention\"",
            "<> \"Juge du pôle social\""
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock  Accidents du travail agricole des non salariés",
            "Stock Commission rogatoire",
            "Stock Ventes",
            "Stock Règlement amiable de l'exploitation agricole et des entreprises en difficulté"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.2.": {
      "label": "4.2. Droit de la famille",
      "Code nomenclature": "4.2.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "20H",
            "26D",
            "26E",
            "26F",
            "26G",
            "26H",
            "26J",
            "26K",
            "26Y",
            "28G",
            "23A",
            "23B",
            "23I",
            "23J",
            "23K",
            "2AA",
            "2AB",
            "2AC",
            "2AD",
            "2AE",
            "2AF",
            "2AG",
            "2AH",
            "2AI",
            "2AJ",
            "2AK",
            "2AM",
            "2AN",
            "2AO",
            "2AP",
            "2AQ",
            "2AR",
            "2AS",
            "2AT",
            "2AU",
            "2AV",
            "2AZ",
            "25A",
            "25B",
            "25C",
            "25D",
            "28A",
            "28B",
            "28C",
            "28D",
            "28E",
            "28F",
            "28H",
            "28I",
            "28Z",
            "29A",
            "29B",
            "29C",
            "29D",
            "29E",
            "29F",
            "29Z"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "20H",
            "26D",
            "26E",
            "26F",
            "26G",
            "26H",
            "26J",
            "26K",
            "26Y",
            "28G",
            "2AI",
            "2AJ",
            "23A",
            "23B",
            "23I",
            "23J",
            "23K",
            "2AA",
            "2AB",
            "2AC",
            "2AD",
            "2AE",
            "2AF",
            "2AG",
            "2AH",
            "2AI",
            "2AJ",
            "2AK",
            "2AM",
            "2AN",
            "2AO",
            "2AP",
            "2AQ",
            "2AR",
            "2AS",
            "2AT",
            "2AU",
            "2AV",
            "2AZ",
            "25A",
            "25B",
            "25C",
            "25D",
            "28A",
            "28B",
            "28C",
            "28D",
            "28E",
            "28F",
            "28H",
            "28I",
            "28Z",
            "29A",
            "29B",
            "29C",
            "29D",
            "29E",
            "29F",
            "29Z"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "20H",
            "26D",
            "26E",
            "26F",
            "26G",
            "26H",
            "26J",
            "26K",
            "26Y",
            "28G",
            "2AI",
            "2AJ",
            "23A",
            "23B",
            "23I",
            "23J",
            "23K",
            "2AA",
            "2AB",
            "2AC",
            "2AD",
            "2AE",
            "2AF",
            "2AG",
            "2AH",
            "2AI",
            "2AJ",
            "2AK",
            "2AM",
            "2AN",
            "2AO",
            "2AP",
            "2AQ",
            "2AR",
            "2AS",
            "2AT",
            "2AU",
            "2AV",
            "2AZ",
            "25A",
            "25B",
            "25C",
            "25D",
            "28A",
            "28B",
            "28C",
            "28D",
            "28E",
            "28F",
            "28H",
            "28I",
            "28Z",
            "29A",
            "29B",
            "29C",
            "29D",
            "29E",
            "29F",
            "29Z"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.3.": {
      "label": "4.3. Contrats",
      "Code nomenclature": "4.3.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "50A",
            "50B",
            "50C",
            "50D",
            "50E",
            "50F",
            "50G",
            "50Z",
            "53A",
            "53D",
            "55A",
            "55B",
            "55Z",
            "56A",
            "56B",
            "56C",
            "56D",
            "56E",
            "56F",
            "56Z",
            "57A",
            "57B",
            "57X",
            "58A",
            "58B",
            "58C",
            "58D",
            "58E",
            "58F",
            "58G",
            "58H",
            "58Z",
            "59A",
            "59B",
            "59C",
            "59D",
            "59E",
            "59F",
            "59G",
            "59H",
            "59X"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "50A",
            "50B",
            "50C",
            "50D",
            "50E",
            "50F",
            "50G",
            "50Z",
            "53A",
            "53D",
            "55A",
            "55B",
            "55Z",
            "56A",
            "56B",
            "56C",
            "56D",
            "56E",
            "56F",
            "56Z",
            "57A",
            "57B",
            "57X",
            "58A",
            "58B",
            "58C",
            "58D",
            "58E",
            "58F",
            "58G",
            "58H",
            "58Z",
            "59A",
            "59B",
            "59C",
            "59D",
            "59E",
            "59F",
            "59G",
            "59H",
            "59X"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "50A",
            "50B",
            "50C",
            "50D",
            "50E",
            "50F",
            "50G",
            "50Z",
            "53A",
            "53D",
            "55A",
            "55B",
            "55Z",
            "56A",
            "56B",
            "56C",
            "56D",
            "56E",
            "56F",
            "56Z",
            "57A",
            "57B",
            "57X",
            "58A",
            "58B",
            "58C",
            "58D",
            "58E",
            "58F",
            "58G",
            "58H",
            "58Z",
            "59A",
            "59B",
            "59C",
            "59D",
            "59E",
            "59F",
            "59G",
            "59H",
            "59X"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.4.": {
      "label": "4.4. Responsabilité et quasi-contrats",
      "Code nomenclature": "4.4.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "60A",
            "60B",
            "60C",
            "61A",
            "61B",
            "62A",
            "62B",
            "62X",
            "63A",
            "63B",
            "63C",
            "63D",
            "64A",
            "64B",
            "64C",
            "64D",
            "64E",
            "64F",
            "64G",
            "65A",
            "65B",
            "65C",
            "66A",
            "66B",
            "66C"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : juge des libertés et de la détention",
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "60A",
            "60B",
            "60C",
            "61A",
            "61B",
            "62A",
            "62B",
            "62X",
            "63A",
            "63B",
            "63C",
            "63D",
            "64A",
            "64B",
            "64C",
            "64D",
            "64E",
            "64F",
            "64G",
            "65A",
            "65B",
            "65C",
            "66A",
            "66B",
            "66C"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Juge des libertés et de la détention",
            "A. T. TGI : Ventes",
            "Contentieux général-affaires terminées",
            "Contentieux général Tribunal paritaire des baux ruraux-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "60A",
            "60B",
            "60C",
            "61A",
            "61B",
            "62A",
            "62B",
            "62X",
            "63A",
            "63B",
            "63C",
            "63D",
            "64A",
            "64B",
            "64C",
            "64D",
            "64E",
            "64F",
            "64G",
            "65A",
            "65B",
            "65C",
            "66A",
            "66B",
            "66C"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes",
            "Stock  Juge des libertés et de la détention",
            "Stock  Accidents du travail agricole des non salariés"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.5.": {
      "label": "4.5. Droit des biens",
      "Code nomenclature": "4.5.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "70A",
            "70B",
            "70C",
            "70D",
            "70E",
            "70F",
            "70G",
            "70H",
            "70I",
            "70J",
            "70K",
            "70Z",
            "71A",
            "71B",
            "71C",
            "71D",
            "71E",
            "71F",
            "71G",
            "71H",
            "71I",
            "71J",
            "71K",
            "71L",
            "71M",
            "71N",
            "72A",
            "72B",
            "72C",
            "72D",
            "72E",
            "72F",
            "72G",
            "72H",
            "72I",
            "72J",
            "72Z",
            "73A",
            "73B",
            "73X",
            "73Z",
            "74A",
            "74B",
            "74C",
            "74D",
            "74E",
            "74F",
            "74Z",
            "75A",
            "75B",
            "75D",
            "75E"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles",
            "A. N. TGI : expropriations"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "70A",
            "70B",
            "70C",
            "70D",
            "70E",
            "70F",
            "70G",
            "70H",
            "70I",
            "70J",
            "70K",
            "70Z",
            "71A",
            "71B",
            "71C",
            "71D",
            "71E",
            "71F",
            "71G",
            "71H",
            "71I",
            "71J",
            "71K",
            "71L",
            "71M",
            "71N",
            "72A",
            "72B",
            "72C",
            "72D",
            "72E",
            "72F",
            "72G",
            "72H",
            "72I",
            "72J",
            "72Z",
            "73A",
            "73B",
            "73X",
            "73Z",
            "74A",
            "74B",
            "74C",
            "74D",
            "74E",
            "74F",
            "74Z",
            "75A",
            "75B",
            "75D",
            "75E"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Expropriations",
            "Contentieux général Justice de proximité-affaires terminées",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "70A",
            "70B",
            "70C",
            "70D",
            "70E",
            "70F",
            "70G",
            "70H",
            "70I",
            "70J",
            "70K",
            "70Z",
            "71A",
            "71B",
            "71C",
            "71D",
            "71E",
            "71F",
            "71G",
            "71H",
            "71I",
            "71J",
            "71K",
            "71L",
            "71M",
            "71N",
            "72A",
            "72B",
            "72C",
            "72D",
            "72E",
            "72F",
            "72G",
            "72H",
            "72I",
            "72J",
            "72Z",
            "73A",
            "73B",
            "73X",
            "73Z",
            "74A",
            "74B",
            "74C",
            "74D",
            "74E",
            "74F",
            "74Z",
            "75A",
            "75B",
            "75D",
            "75E"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes",
            "Stock Expropriation",
            "Stock  Juge des libertés et de la détention",
            "Stock  Accidents du travail agricole des non salariés"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.6.": {
      "label": "4.6. Construction",
      "Code nomenclature": "4.6.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "54A",
            "54B",
            "54C",
            "54D",
            "54E",
            "54F",
            "54G",
            "54Z"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "54A",
            "54B",
            "54C",
            "54D",
            "54E",
            "54F",
            "54G",
            "54Z"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Expropriations",
            "Contentieux général Justice de proximité-affaires terminées",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "54A",
            "54B",
            "54C",
            "54D",
            "54E",
            "54F",
            "54G",
            "54Z"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes",
            "Stock Expropriation",
            "Stock  Juge des libertés et de la détention",
            "Stock  Accidents du travail agricole des non salariés"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.7.": {
      "label": "4.7. Exécution",
      "Code nomenclature": "4.7.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "24H",
            "76A",
            "76B",
            "76D",
            "76E",
            "76F",
            "76H",
            "76X",
            "77A",
            "77B",
            "78A",
            "78B",
            "78C",
            "78E",
            "78F",
            "78G",
            "78I",
            "78J",
            "78K",
            "78M",
            "78N",
            "78O",
            "78P",
            "78Q",
            "78R",
            "78S",
            "78T",
            "78X",
            "5A",
            "5M",
            "5N",
            "5O",
            "5P",
            "5C",
            "5H",
            "5R",
            "30B"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : ventes",
            "A. N. TGI : juge des libertés et de la détention",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "24H",
            "76A",
            "76B",
            "76D",
            "76E",
            "76F",
            "76H",
            "76X",
            "77A",
            "77B",
            "78A",
            "78B",
            "78C",
            "78E",
            "78F",
            "78G",
            "78I",
            "78J",
            "78K",
            "78M",
            "78N",
            "78O",
            "78P",
            "78Q",
            "78R",
            "78S",
            "78T",
            "78X",
            "5A",
            "5M",
            "5N",
            "5O",
            "5P",
            "5C",
            "5H",
            "5R",
            "30B"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Ventes",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "24H",
            "76A",
            "76B",
            "76D",
            "76E",
            "76F",
            "76H",
            "76X",
            "77A",
            "77B",
            "78A",
            "78B",
            "78C",
            "78E",
            "78F",
            "78G",
            "78I",
            "78J",
            "78K",
            "78M",
            "78N",
            "78O",
            "78P",
            "78Q",
            "78R",
            "78S",
            "78T",
            "78X",
            "5A",
            "5M",
            "5N",
            "5O",
            "5P",
            "5C",
            "5H",
            "5R",
            "30B"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock  Accidents du travail agricole des non salariés",
            "Stock Commission rogatoire",
            "Stock Ventes",
            "Stock Règlement amiable de l'exploitation agricole et des entreprises en difficulté",
            "Stock  Juge des libertés et de la détention"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.7.00.": {
      "label": "4.7. Exécution 00A",
      "Code nomenclature": "4.7.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge de l'exécution",
            "Juge de l'exécution saisi sur requête"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge de l'exécution",
            "Juge de l'exécution saisi sur requête"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "00A"
          ],
          "AUTSAI": [
            "Juge de l'exécution",
            "Juge de l'exécution saisi sur requête"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Ventes"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.7.01.": {
      "label": "4.7. Exécution autres",
      "Code nomenclature": "4.7.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "51A",
            "51B",
            "51C",
            "51D",
            "51E",
            "51F",
            "51G",
            "51H",
            "51I",
            "51J",
            "51K",
            "51L",
            "51M",
            "51Z",
            "52A",
            "52B",
            "52C",
            "52D",
            "52E",
            "52F",
            "52G",
            "52Z"
          ],
          "AUTSAI": [
            "Juge de l'exécution",
            "Juge de l'exécution saisi sur requête"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "51A",
            "51B",
            "51C",
            "51D",
            "51E",
            "51F",
            "51G",
            "51H",
            "51I",
            "51J",
            "51K",
            "51L",
            "51M",
            "51Z",
            "52A",
            "52B",
            "52C",
            "52D",
            "52E",
            "52F",
            "52G",
            "52Z"
          ],
          "AUTSAI": [
            "Juge de l'exécution",
            "Juge de l'exécution saisi sur requête"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "51A",
            "51B",
            "51C",
            "51D",
            "51E",
            "51F",
            "51G",
            "51H",
            "51I",
            "51J",
            "51K",
            "51L",
            "51M",
            "51Z",
            "52A",
            "52B",
            "52C",
            "52D",
            "52E",
            "52F",
            "52G",
            "52Z"
          ],
          "AUTSAI": [
            "Juge de l'exécution",
            "Juge de l'exécution saisi sur requête"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Ventes"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.8.": {
      "label": "4.8. Droit des affaires",
      "Code nomenclature": "4.8.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "30A",
            "30C",
            "30D",
            "30E",
            "30F",
            "30G",
            "30H",
            "30Z",
            "31A",
            "31B",
            "31C",
            "31D",
            "31E",
            "31F",
            "31G",
            "31H",
            "31Z",
            "32A",
            "32B",
            "32C",
            "32D",
            "32E",
            "32F",
            "32Z",
            "33A",
            "33B",
            "33C",
            "33D",
            "33E",
            "33F",
            "33G",
            "33H",
            "33X",
            "33Z",
            "34A",
            "34B",
            "34C",
            "34D",
            "34E",
            "34F",
            "34G",
            "34H",
            "35A",
            "35B",
            "35C",
            "35D",
            "35F",
            "35G",
            "35H",
            "35E",
            "35Z",
            "35X",
            "36A",
            "36B",
            "36C",
            "36D",
            "36E",
            "36F",
            "36X",
            "36Z",
            "38A",
            "38B",
            "38C",
            "38D",
            "38E",
            "38F",
            "38G",
            "38Z",
            "42A"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "Contentieux général-affaires nouvelles"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "30A",
            "30C",
            "30D",
            "30E",
            "30F",
            "30G",
            "30H",
            "30Z",
            "31A",
            "31B",
            "31C",
            "31D",
            "31E",
            "31F",
            "31G",
            "31H",
            "31Z",
            "32A",
            "32B",
            "32C",
            "32D",
            "32E",
            "32F",
            "32Z",
            "33A",
            "33B",
            "33C",
            "33D",
            "33E",
            "33F",
            "33G",
            "33H",
            "33X",
            "33Z",
            "34A",
            "34B",
            "34C",
            "34D",
            "34E",
            "34F",
            "34G",
            "34H",
            "35A",
            "35B",
            "35C",
            "35D",
            "35E",
            "35Z",
            "35F",
            "35G",
            "35H",
            "35X",
            "36A",
            "36B",
            "36C",
            "36D",
            "36E",
            "36F",
            "36X",
            "36Z",
            "38A",
            "38B",
            "38C",
            "38D",
            "38E",
            "38F",
            "38G",
            "38Z",
            "42A"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Expropriations",
            "Contentieux général Justice de proximité-affaires terminées",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "30A",
            "30C",
            "30D",
            "30E",
            "30F",
            "30G",
            "30H",
            "30Z",
            "31A",
            "31B",
            "31C",
            "31D",
            "31E",
            "31F",
            "31G",
            "31H",
            "31Z",
            "32A",
            "32B",
            "32C",
            "32D",
            "32E",
            "32F",
            "32Z",
            "33A",
            "33B",
            "33C",
            "33D",
            "33E",
            "33F",
            "33G",
            "33H",
            "33X",
            "33Z",
            "34A",
            "34B",
            "34C",
            "34D",
            "34E",
            "34F",
            "34G",
            "34H",
            "35A",
            "35B",
            "35C",
            "35D",
            "35E",
            "35Z",
            "35F",
            "35G",
            "35H",
            "35X",
            "36A",
            "36B",
            "36C",
            "36D",
            "36E",
            "36F",
            "36X",
            "36Z",
            "38A",
            "38B",
            "38C",
            "38D",
            "38E",
            "38F",
            "38G",
            "38Z",
            "42A"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes",
            "Stock Expropriation",
            "Stock  Juge des libertés et de la détention",
            "Stock  Accidents du travail agricole des non salariés"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "4.9.": {
      "label": "4.9. Procédures collectives civiles",
      "Code nomenclature": "4.9.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "4AA",
            "4AB",
            "4AC",
            "4AD",
            "4AE",
            "4AF",
            "4AG",
            "4AH",
            "4AI",
            "4AJ",
            "4AK",
            "4AL",
            "4AM",
            "4AN",
            "4AO",
            "4AP",
            "4BA",
            "4BB",
            "4CA",
            "4CB",
            "4CC",
            "4CD",
            "4DA",
            "4DB",
            "4DC",
            "4DD",
            "4DE",
            "4DF",
            "4EA",
            "4EB",
            "4EC",
            "4FA",
            "4FB",
            "4FC",
            "4FD",
            "4FE",
            "4FF",
            "4FG",
            "4FH",
            "4FI",
            "4FJ",
            "4FK",
            "4GA",
            "4GB",
            "4GC",
            "4GD",
            "4GE",
            "4GF",
            "4HA",
            "4HB",
            "4HC",
            "4IA",
            "4IB",
            "4IC",
            "4ID",
            "4IE",
            "4IF",
            "4IG",
            "4IH",
            "4II",
            "4JA",
            "4JB",
            "4JC",
            "4JD",
            "4JE",
            "4JF",
            "4JG",
            "4JH",
            "4JI",
            "4JJ",
            "4JK",
            "4JL",
            "40A",
            "40B",
            "40C",
            "40D",
            "40E",
            "40F",
            "40G",
            "40H",
            "40I",
            "41A",
            "41Z",
            "43A",
            "43C",
            "43D",
            "43E",
            "44A",
            "44B",
            "44C",
            "45B",
            "45G",
            "45H",
            "46B",
            "47A",
            "47B",
            "47C",
            "47D",
            "47E",
            "47G",
            "4AQ",
            "4FL",
            "4FM"
          ],
          "C_TUS": [
            "A. N. TGI : contentieux général hors divorce",
            "A. N. TGI : redressements et liquidations judiciaires",
            "Contentieux général-affaires nouvelles",
            "A. N. TGI : règlements amiables agricoles, SCI, associations"
          ],
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "4AA",
            "4AB",
            "4AC",
            "4AD",
            "4AE",
            "4AF",
            "4AG",
            "4AH",
            "4AI",
            "4AJ",
            "4AK",
            "4AL",
            "4AM",
            "4AN",
            "4AO",
            "4AP",
            "4BA",
            "4BB",
            "4CA",
            "4CB",
            "4CC",
            "4CD",
            "4DA",
            "4DB",
            "4DC",
            "4DD",
            "4DE",
            "4DF",
            "4EA",
            "4EB",
            "4EC",
            "4FA",
            "4FB",
            "4FC",
            "4FD",
            "4FE",
            "4FF",
            "4FG",
            "4FH",
            "4FI",
            "4FJ",
            "4FK",
            "4GA",
            "4GB",
            "4GC",
            "4GD",
            "4GE",
            "4GF",
            "4HA",
            "4HB",
            "4HC",
            "4IA",
            "4IB",
            "4IC",
            "4ID",
            "4IE",
            "4IF",
            "4IG",
            "4IH",
            "4II",
            "4JA",
            "4JB",
            "4JC",
            "4JD",
            "4JE",
            "4JF",
            "4JG",
            "4JH",
            "4JI",
            "4JJ",
            "4JK",
            "4JL",
            "40A",
            "40B",
            "40C",
            "40D",
            "40E",
            "40F",
            "40G",
            "40H",
            "40I",
            "41A",
            "41Z",
            "43A",
            "43C",
            "43D",
            "43E",
            "44A",
            "44B",
            "44C",
            "45B",
            "45G",
            "45H",
            "46B",
            "47A",
            "47B",
            "47C",
            "47D",
            "47E",
            "47G",
            "4AQ",
            "4FL",
            "4FM"
          ],
          "C_TUS": [
            "A. T. TGI : Contentieux général hors divorce",
            "A. T. TGI : Expropriations",
            "A. T. TGI : Redressements et liquidations judiciaires",
            "A. T. TGI : Règlements amiables agricoles, SCI, associations",
            "Contentieux général Justice de proximité-affaires terminées",
            "Contentieux général-affaires terminées"
          ],
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "4AA",
            "4AB",
            "4AC",
            "4AD",
            "4AE",
            "4AF",
            "4AG",
            "4AH",
            "4AI",
            "4AJ",
            "4AK",
            "4AL",
            "4AM",
            "4AN",
            "4AO",
            "4AP",
            "4BA",
            "4BB",
            "4CA",
            "4CB",
            "4CC",
            "4CD",
            "4DA",
            "4DB",
            "4DC",
            "4DD",
            "4DE",
            "4DF",
            "4EA",
            "4EB",
            "4EC",
            "4FA",
            "4FB",
            "4FC",
            "4FD",
            "4FE",
            "4FF",
            "4FG",
            "4FH",
            "4FI",
            "4FJ",
            "4FK",
            "4GA",
            "4GB",
            "4GC",
            "4GD",
            "4GE",
            "4GF",
            "4HA",
            "4HB",
            "4HC",
            "4IA",
            "4IB",
            "4IC",
            "4ID",
            "4IE",
            "4IF",
            "4IG",
            "4IH",
            "4II",
            "4JA",
            "4JB",
            "4JC",
            "4JD",
            "4JE",
            "4JF",
            "4JG",
            "4JH",
            "4JI",
            "4JJ",
            "4JK",
            "4JL",
            "40A",
            "40B",
            "40C",
            "40D",
            "40E",
            "40F",
            "40G",
            "40H",
            "40I",
            "41A",
            "41Z",
            "43A",
            "43C",
            "43D",
            "43E",
            "44A",
            "44B",
            "44C",
            "45B",
            "45G",
            "45H",
            "46B",
            "47A",
            "47B",
            "47C",
            "47D",
            "47E",
            "47G",
            "4AQ",
            "4FL",
            "4FM"
          ],
          "C_TUS": [
            "Stock Contentieux général",
            "Stock Tribunal des pensions militaires",
            "Stock Ventes",
            "Stock Expropriation",
            "Stock  Juge des libertés et de la détention",
            "Stock  Accidents du travail agricole des non salariés",
            "Stock Règlement amiable de l'exploitation agricole et des entreprises en difficulté",
            "Stock Conciliation, Sauvegarde, Redressements et liquidations judiciaires"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "5.1.": {
      "label": "5.1. Rétention des étrangers",
      "Code nomenclature": "5.1.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "14G",
            "14H",
            "14N",
            "14Q",
            "14R"
          ],
          "C_TUS": "A. N. TGI : juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "14G",
            "14H",
            "14N",
            "14Q",
            "14R"
          ],
          "C_TUS": "A. T. TGI : Juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "14G",
            "14H",
            "14N",
            "14Q",
            "14R"
          ],
          "C_TUS": [
            "Stock  Juge des libertés et de la détention",
            "Stock Commission rogatoire"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "5.2.": {
      "label": "5.2. Hospitalisations sous contrainte",
      "Code nomenclature": "5.2.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "14C",
            "14I",
            "14J",
            "14K",
            "14L"
          ],
          "C_TUS": "A. N. TGI : juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "14C",
            "14I",
            "14J",
            "14K",
            "14L"
          ],
          "C_TUS": "A. T. TGI : Juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "14C",
            "14I",
            "14J",
            "14K",
            "14L"
          ],
          "C_TUS": [
            "Stock  Juge des libertés et de la détention",
            "Stock Commission rogatoire"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "5.3.": {
      "label": "5.3. Autres JLD civil",
      "Code nomenclature": "5.3.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "14O",
            "14P",
            "14S",
            "14T",
            "78U"
          ],
          "C_TUS": "A. N. TGI : juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "14O",
            "14P",
            "14S",
            "14T",
            "78U"
          ],
          "C_TUS": "A. T. TGI : Juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "14O",
            "14P",
            "14S",
            "14T",
            "78U"
          ],
          "C_TUS": [
            "Stock  Juge des libertés et de la détention",
            "Stock Commission rogatoire"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    },
    "5.3.00": {
      "label": "5.3. Autres JLD civil 00A",
      "Code nomenclature": "5.3.",
      "filtres": {
        "entrees": {
          "NATAFF": [
            "00A"
          ],
          "C_TUS": "A. N. TGI : juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "sorties": {
          "NATAFF": [
            "00A"
          ],
          "C_TUS": "A. T. TGI : Juge des libertés et de la détention",
          "TOTAL": "NBAFF"
        },
        "stock": {
          "NATAFF": [
            "00A"
          ],
          "C_TUS": [
            "Stock  Juge des libertés et de la détention"
          ],
          "TOTAL": "NBAFFDUR"
        }
      }
    }
  }
}
