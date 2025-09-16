import { Component, ViewChildren, QueryList, ElementRef, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { CommonModule } from '@angular/common'
import { UserService } from '../../services/user/user.service'
import { ServerService } from '../../services/http-server/server.service'
import { SSOService } from '../../services/sso/sso.service'
import { MIN_PASSWORD_LENGTH } from '../../utils/user'

/**
 * Page d'inscription
 */
@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, FormsModule, CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  /**
   * Service de gestion de l'utilisateur
   */
  userService = inject(UserService)
  /**
   * Service de navigation
   */
  router = inject(Router)
  /**
   * Service de gestion du titre
   */
  title = inject(Title)
  /**
   * Service de communication avec le serveur
   */
  serverService = inject(ServerService)
  /**
   * Service de gestion des paramètres de l'URL
   */
  route = inject(ActivatedRoute)
  /**
   * Service de gestion de l'authentification SSO
   */
  ssoService = inject(SSOService)
  /**
   * Longueur minimale du mot de passe
   */
  MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH

  /**
   * Liste des inputs
   */
  @ViewChildren('input') inputs: QueryList<ElementRef> = new QueryList<ElementRef>()

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
   * SSO is activate to this env
   */
  ssoIsActivate: boolean = import.meta.env.NG_APP_ENABLE_SSO
  /**
   * Can user SSO
   */
  canUseSSO: boolean = true
  /**
   * Step d'inscription
   */
  signUpStep = 1
  /**
   * Mot de passe paramètres de validation
   */
  passwordStrength = {
    length: false,
    char: false,
    number: false,
    majuscule: false,
  }
  /**
   * Liste des fonctions (1VP, VP, ...)
   */
  fonctions: string[] = [
    this.userService.isCa() ? 'Premier président' : 'Président(e)',
    'Directeur/trice de greffe',
    'Secrétaire général(e)',
    'Chef(fe) de cabinet',
    'Chargé(e) de mission',
    this.userService.isCa() ? 'Secrétariat Première présidence' : 'Secrétaire administratif - présidence',
    'Secrétaire administratif - DG',
    'Directeur/trice de greffe adjoint(e)',
    'Directeur/trice des services de greffe judiciaires',
  ]
  /**
   * Liste des TJ
   */
  tjs: any[] = []
  /**
   * Fournisseur
   */
  provider: string = ''

  /**
   * Params
   */
  paramsUrl: {
    /**
     * Email
     */
    email: string
    /**
     * Fournisseur
     */
    provider: string
  } | null = null

  /**
   * Constructeur
   */
  constructor() {
    this.title.setTitle((this.userService.isCa() ? 'A-Just CA | ' : 'A-Just TJ | ') + 'Embarquement')
    this.loadTj()

    this.route.queryParams.subscribe((p: any) => {
      this.paramsUrl = p
      if (p.email) {
        this.form.get('email')?.setValue(p.email)
        this.form.get('email')?.disable()
      } else {
        this.form.get('email')?.enable()
      }

      if (p.firstName) {
        this.form.get('firstName')?.setValue(p.firstName)
      }

      if (p.lastName) {
        this.form.get('lastName')?.setValue(p.lastName)
      }

      if (p.provider) {
        this.provider = p.provider
        this.signUpStep = 2
      }
    })
  }

  /**
   * Envoi des informations d'inscriptions
   * @returns
   */
  onSubmit() {
    let { email, password, firstName, lastName, passwordConf, fonction, tj, checkbox, fonctionAutre, responsable } = this.form.value

    if (this.paramsUrl?.email) {
      email = this.paramsUrl?.email
    }

    if (!tj) {
      if (this.userService.isCa()) {
        alert('Vous devez saisir une CA')
      } else {
        alert('Vous devez saisir un TJ')
      }
      return
    }

    if (!fonction) {
      alert('Vous devez saisir une fonction')
      return
    }

    if (fonction === 'Autre' && !fonctionAutre) {
      alert('Vous devez saisir un intitulé de fonction')
      return
    }

    if (fonction === 'Autre' && !responsable) {
      alert("Vous devez saisir le nom d'un responsable hiérarchique")
      return
    }

    if (fonction === 'Autre') fonction = fonctionAutre + ' - Resp hiér : ' + responsable

    this.userService.register({ email, password, firstName, lastName, fonction, tj }).then((returnLogin) => {
      if (returnLogin) {
        this.router.navigate([this.userService.getUserPageUrl(returnLogin.user)])
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
    let { email, password, firstName, lastName, passwordConf, fonction, tj, checkbox } = this.form.value

    if (!firstName || !lastName) {
      alert('Vous devez saisir un nom et un prénom')
      return
    }

    if (!email) {
      alert('Vous devez saisir un email')
      return
    }

    if (!this.paramsUrl?.email && email.includes('@justice.fr') === false && email.includes('.gouv.fr') === false && email.includes('@a-just.fr') === false) {
      alert('Vous devez saisir une adresse e-mail professionnelle')
      return
    }

    if (!password) {
      alert('Vous devez saisir un mot de passe')
      return
    }

    if (!passwordConf) {
      alert('Vous devez confirmer votre mot de passe')
      return
    }

    if (this.paramsUrl?.email) {
      email = this.paramsUrl?.email
    }

    if (!checkbox) {
      alert("Vous devez valider les conditions générales d'utilisation")
      return
    }

    var arrayOfSp = ['!', '@', '#', '$', '%', '&', '*', '_', '?', '-']
    var regex = '[' + arrayOfSp.join('') + ']'

    if (!this.paramsUrl?.provider) {
      if (!password || password.length < MIN_PASSWORD_LENGTH || !password.match(/\d/) || !new RegExp(regex).test(password) || !password.match(/[A-Z]/g)) {
        alert('Vous devez saisir un mot de passe qui remplit les critères obligatoires')
        return
      }

      if (password !== passwordConf) {
        alert('Vos mots de passe ne sont pas identiques')
        return
      }
    }

    this.signUpStep = 2
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

    var arrayOfSp = ['!', '@', '#', '$', '%', '&', '*', '_', '?', '-']
    var regex = '[' + arrayOfSp.join('') + ']'
    if (password && new RegExp(regex).test(password)) {
      this.passwordStrength.char = true
    } else this.passwordStrength.char = false

    if (password && password.length > MIN_PASSWORD_LENGTH) {
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
    this.fonctions.map((fct) => {
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
    this.serverService.get('juridictions/get-all-visibles').then((data) => {
      this.tjs = data.data
      //this.tjs = data.data.map((x: any) => { return { ...x, label: x.label.slice(3) } })
    })
  }

  /**
   * Enregistre la valeur de TJ choisie
   * @param event
   */
  setTj(event: any) {
    this.tjs.map((tj) => {
      if (tj.id === +event.value) {
        this.form.controls['tj'].setValue(tj.label)
      }
    })
  }

  onUseSSO() {
    //if (!this.canUseSSO) {
    //  alert(
    //    "Vous devez être dans l'environement Justice pour utiliser page blanche !"
    //  )
    //} else {
    window.location.href = this.ssoService.getSSOLogin()
    //}
  }

  /**
   * Permet à l'utilisateur de passer d'un input à un autre avec la touche "Entrée"
   * @param event
   */
  focusNext(event: any) {
    event.preventDefault()
    const inputsArray = this.inputs.toArray()
    const currentIndex = inputsArray.findIndex((input) => input.nativeElement === event.target)
    if (currentIndex > -1 && currentIndex < inputsArray.length - 1) {
      inputsArray[currentIndex + 1].nativeElement.focus()
    }
  }

  /**
   * Empêche la soumission du formulaire lorsque l'utilisateur presse la touche "Entrée"
   * @param event
   */
  preventSubmit(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }
}
