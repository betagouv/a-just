import { Component } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { ServerService } from 'src/app/services/http-server/server.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'

const MIN_PASSWORD_LENGTH = 8

/**
 * Page d'inscription
 */
@Component({
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  /**
   * Formulaire d'inscription
   */
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    fonction: new FormControl(),
    tj: new FormControl(),
    firstName: new FormControl(),
    lastName: new FormControl(),
    passwordConf: new FormControl(),
    checkbox: new FormControl(),
    checkboxPassword: new FormControl(),
    fonctionAutre: new FormControl(),
    responsable: new FormControl(),
  })

  /**
   * Step d'inscription
   */
  signUpStep = 1
  /**
   * Mot de passe paramètres de validation
   */
  passwordStrength = { length: false, char: false, number: false, majuscule: false }
  /**
     * Liste des fonctions (1VP, VP, ...)
     */
  fonctions: string[] = ['Président(e)',
    'Directeur/trice de greffe',
    'Secrétaire général(e)',
    'Chef(fe) de cabinet',
    'Chargé(e) de mission',
    'Secrétaire administratif - présidence',
    'Secrétaire administratif - DG',
    'Directeur/trice de greffe adjoint(e)',
    'Directeur/trice des services de greffe judiciaires']

  tjs: any[] = []

  /**
   * Constructeur
   * @param userService
   * @param router
   * @param title
   */
  constructor(
    private userService: UserService,
    private router: Router,
    private title: Title,
    private hrFonctionService: HRFonctionService,
    private serverService: ServerService
  ) {
    this.title.setTitle('Embarquement | A-Just')
    this.loadTj()
  }

  /**
   * Envoi des informations d'inscriptions
   * @returns
   */
  onSubmit() {
    let {
      email,
      password,
      firstName,
      lastName,
      passwordConf,
      fonction,
      tj,
      checkbox,
      fonctionAutre,
      responsable
    } = this.form.value

    if (!tj) {
      alert("Vous devez saisir un TJ")
      return
    }

    if (!fonction) {
      alert("Vous devez saisir une fonction")
      return
    }

    if ((fonction === 'Autre' && !fonctionAutre)) {
      alert("Vous devez saisir un intitulé de fonction")
      return
    }

    if ((fonction === 'Autre' && !responsable)) {
      alert("Vous devez saisir le nom d'un responsable hiérarchique")
      return
    }

    if (fonction === 'Autre') fonction = fonctionAutre + ' - Resp hiér : ' + responsable

    this.userService
      .register({ email, password, firstName, lastName, fonction, tj })
      .then((returnLogin) => {
        if (returnLogin) {
          this.router.navigate([
            this.userService.getUserPageUrl(returnLogin.user),
          ])
        } else {
          this.router.navigate(['/login'])
        }
      })
  }


  /**
   * Validation et verification des champs de l'étape 1
   * @returns 
   */
  onStepTwo() {
    const {
      email,
      password,
      firstName,
      lastName,
      passwordConf,
      fonction,
      tj,
      checkbox,
    } = this.form.value


    if (!firstName || !lastName) {
      alert("Vous devez saisir un nom et un prénom")
      return
    }

    if (!email || !this.validateEmail(email)) {
      alert("Vous devez saisir un mail valide")
      return
    }

    if (!checkbox) {
      alert("Vous devez valider les conditions générales d'utilisation")
      return
    }

    var arrayOfSp = ["!", "@", "#", "$", "%", "&", "*", "_", "?", "-"];
    var regex = "[" + arrayOfSp.join("") + "]";

    if (!password || password.length < MIN_PASSWORD_LENGTH || !password.match(/\d/) || !new RegExp(regex).test(password) || !password.match(/[A-Z]/g)) {
      alert("Vous devez saisir un mot de passe qui rempli les critères obligatoires")
      return
    }

    if (password !== passwordConf) {
      alert('Vos mots de passe ne sont pas identiques')
      return
    }

    this.signUpStep = 2

  }

  /**
   * Validation du mail type
   * @param email 
   * @returns 
   */
  validateEmail(email: string) {
    const res = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return res.test(String(email).toLowerCase());
  }


  /**
   * Retourne la couleur de l'étape 2 (indicateur)
   * @returns 
   */
  getStepColor() {
    return this.signUpStep === 1 ? '#eeeeee' : '#000091'
  }

  /**
   * Vérifie la robustesse du mot de passe
   * @param event 
   */
  checkStrength(event: any) {
    const password = event.target.value

    if (password && password.match(/\d/)) {
      this.passwordStrength.number = true
    } else this.passwordStrength.number = false

    var arrayOfSp = ["!", "@", "#", "$", "%", "&", "*", "_", "?", "-"];
    var regex = "[" + arrayOfSp.join("") + "]";
    if (password && new RegExp(regex).test(password)) {
      this.passwordStrength.char = true
    } else this.passwordStrength.char = false

    if (password && password.length > 6) {
      this.passwordStrength.length = true
    } else this.passwordStrength.length = false

    if (password && password.match(/[A-Z]/g)) {
      this.passwordStrength.majuscule = true
    } else this.passwordStrength.majuscule = false
  }

  /**
   * Retourne la couleur des différents éléments de validation de mot de passe
   * @param val 
   * @returns 
   */
  getParamColor(val: number) {
    const password = this.form.controls['password'].value
    const options = ['length', 'char', 'number', 'majuscule']

    if (!password) return '#0063cb'
    // @ts-ignore
    else if (this.passwordStrength[options[val]] === false) return 'red'
    else return '#0063cb'
  }



  /**
   * Enregistre la fonction 
   * @param event 
   */
  setFonc(event: any) {
    this.fonctions.map(fct => {
      if (fct === event.value) {
        this.form.controls['fonction'].setValue(fct)
      }
    })
    if (event.value === 'Autre') this.form.controls['fonction'].setValue('Autre')

  }

  /**
   * Charge les TJ
   */
  loadTj() {
    this.serverService
      .get('juridictions/get-all-visibles')
      .then((data) => {
        this.tjs = data.data
        //this.tjs = data.data.map((x: any) => { return { ...x, label: x.label.slice(3) } })
      });
  }

  /**
   * Enregistre la valeur de TJ choisie
   * @param event 
   */
  setTj(event: any) {
    this.tjs.map(tj => {
      if (tj.id === +event.value) {
        this.form.controls['tj'].setValue(tj.label)
      }
    })
  }

}
