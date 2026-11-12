import { Component, ViewChildren, QueryList, ElementRef, inject, ViewChild, computed, Signal } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { CommonModule } from '@angular/common'
import { UserService } from '../../services/user/user.service'
import { ServerService } from '../../services/http-server/server.service'
import { SSOService } from '../../services/sso/sso.service'
import { MIN_PASSWORD_LENGTH } from '../../utils/user'
import { isProfessionalEmailDomain } from '../../utils/string'
import { AutocompleteComponent, AutocompleteOption } from '../../components/autocomplete/autocomplete.component'
import { arrondissementLabel } from '../../utils/arrondissement'
import { JuridictionInterface } from '../../interfaces/juridiction'
import { sortBy } from 'lodash'

/**
 * Page d'inscription
 */
@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, FormsModule, CommonModule, RouterLink, ReactiveFormsModule, AutocompleteComponent],
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  userService = inject(UserService)
  router = inject(Router)
  title = inject(Title)
  serverService = inject(ServerService)
  route = inject(ActivatedRoute)
  ssoService = inject(SSOService)
  MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH

  @ViewChildren('input') inputs: QueryList<ElementRef> = new QueryList<ElementRef>()

  @ViewChild('tjSelect') tjSelect!: AutocompleteComponent
  @ViewChild('fctSelect') fctSelect!: AutocompleteComponent
  @ViewChild('checkbox') checkboxEl!: ElementRef<HTMLInputElement>

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
  get passwordStrength() {
    const password = this.form.controls['password'].value || ''
    return {
      length: password.length >= MIN_PASSWORD_LENGTH,
      char: /[!@#$%&*_?-]/.test(password),
      number: /\d/.test(password),
      majuscule: /[A-Z]/.test(password),
    }
  }
  /**
   * Liste des fonctions (1VP, VP, ...)
   */
  fonctions: Signal<string[]> = computed(() => {
    return this.userService.isCa()
      ? [
          'Premier président',
          'Directeur/trice de greffe',
          'Premier/ère président(e) de chambre',
          'Président(e) de chambre',
          'Secrétaire général(e)',
          'Chef(fe) de cabinet',
          'Chargé(e) de mission',
          'Secrétariat Première présidence',
          'Secrétaire administratif - DG',
          'Directeur/trice de greffe adjoint(e)',
          'Directeur/trice des services de greffe judiciaires',
          'Cadre greffier/ière',
        ]
      : [
          'Président(e)',
          'Directeur/trice de greffe',
          'Premier/ère vice-président(e)',
          'Secrétaire général(e)',
          'Vice-président(e)',
          'Chef(fe) de cabinet',
          'Chargé(e) de mission',
          'Attaché(e) de justice',
          'Secrétaire administratif - présidence',
          'Secrétaire administratif - DG',
          'Directeur/trice de greffe adjoint(e)',
          'Directeur/trice des services de greffe judiciaires',
          'Cadre greffier/ière',
        ]
  })
  fonctionOptions: Signal<AutocompleteOption[]> = computed(() =>
    [...this.fonctions(), 'Autre'].map((label, index) => ({
      id: index + 1,
      label,
    })),
  )
  tjs: JuridictionInterface[] = []
  tjOptions: AutocompleteOption[] = []
  provider: string = ''

  /**
   * Params
   */
  paramsUrl: {
    email: string
    provider: string
  } | null = null

  /**
   * Constructeur
   */
  constructor() {
    this.title.setTitle((this.userService.isCa() ? 'A-Just CA | ' : 'A-Just TJ | ') + 'Embarquement')
    this.loadTj()
    this.userService.getInterfaceType().then(() => this.buildTjOptions())

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
   * Les champs requis de l'étape 1 sont renseignés et valides.
   */
  get canContinue(): boolean {
    const { email, password, passwordConf, firstName, lastName, checkbox } = this.form.getRawValue()
    return Boolean(
      firstName?.trim() &&
      lastName?.trim() &&
      this.selectedFonctionId !== null &&
      email?.trim() &&
      Validators.email(this.form.controls['email']) === null &&
      (this.paramsUrl?.email || isProfessionalEmailDomain(email)) &&
      (this.provider || (Object.values(this.passwordStrength).every(Boolean) && password === passwordConf)) &&
      checkbox,
    )
  }

  /**
   * Les champs requis pour terminer l'inscription sont renseignés et valides.
   */
  get canSubmit(): boolean {
    const { fonction, fonctionAutre, responsable } = this.form.getRawValue()
    return Boolean(
      (this.provider || this.canContinue) &&
      this.selectedTjId !== null &&
      this.selectedFonctionId !== null &&
      (fonction !== 'Autre' || (fonctionAutre?.trim() && responsable?.trim())),
    )
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
      this.focusSoon(() => this.tjSelect?.focus())
      return
    }

    if (!fonction) {
      alert('Vous devez saisir une fonction')
      this.focusSoon(() => this.fctSelect?.focus())
      return
    }

    if (fonction === 'Autre' && !fonctionAutre) {
      alert('Vous devez saisir un intitulé de fonction')
      this.focusSoon(() => this.focusByControlName('fonctionAutre'))

      return
    }

    if (fonction === 'Autre' && !responsable) {
      alert("Vous devez saisir le nom d'un responsable hiérarchique")
      this.focusSoon(() => this.focusByControlName('responsable'))
      return
    }

    if (!this.canSubmit) return

    if (fonction === 'Autre') fonction = fonctionAutre + ' - Resp hiér : ' + responsable

    this.userService.register({ email, password, firstName, lastName, fonction, tj }).then((returnLogin) => {
      if (returnLogin) {
        this.router.navigate(['/bienvenue'])
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
    let { email, password, firstName, lastName, passwordConf, fonction, tj, checkbox } = this.form.getRawValue()

    if (!firstName || !lastName) {
      alert('Vous devez saisir un nom et un prénom')
      this.focusSoon(() => this.focusByControlName(!firstName ? 'firstName' : 'lastName'))
      return
    }

    if (!email) {
      alert('Vous devez saisir un email')
      this.focusSoon(() => this.focusByControlName('email'))
      return
    }

    if (!this.paramsUrl?.email && !isProfessionalEmailDomain(email)) {
      alert('Vous devez saisir une adresse e-mail professionnelle')
      this.focusSoon(() => this.focusByControlName('email'))
      return
    }

    if (!this.provider && !password) {
      alert('Vous devez saisir un mot de passe')
      this.focusSoon(() => this.focusByControlName('password'))
      return
    }

    if (!this.provider && !passwordConf) {
      alert('Vous devez confirmer votre mot de passe')
      this.focusSoon(() => this.focusByControlName('passwordConf'))
      return
    }

    if (this.paramsUrl?.email) {
      email = this.paramsUrl?.email
    }

    if (!checkbox) {
      alert("Vous devez valider les conditions générales d'utilisation")
      this.focusCheckboxSoon()
      return
    }

    if (!this.paramsUrl?.provider) {
      if (!Object.values(this.passwordStrength).every(Boolean)) {
        alert('Vous devez saisir un mot de passe qui remplit les critères obligatoires')
        this.focusSoon(() => this.focusByControlName('password'))
        return
      }

      if (password !== passwordConf) {
        alert('Vos mots de passe ne sont pas identiques')
        this.focusSoon(() => this.focusByControlName('passwordConf'))
        return
      }
    }

    if (this.canContinue) this.signUpStep = 2
  }

  /**
   * Retourne la couleur de l'étape 2 (indicateur)
   * @returns
   */
  getStepColor() {
    return this.signUpStep === 1 ? '#eeeeee' : '#000091'
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
   * Id de la fonction actuellement choisie
   */
  get selectedFonctionId(): number | null {
    const selectedLabel = this.form.controls['fonction'].value
    return this.fonctionOptions().find((option) => option.label === selectedLabel)?.id ?? null
  }

  /**
   * Enregistre la fonction
   * @param option
   */
  setFonc(option: AutocompleteOption | null) {
    this.form.controls['fonction'].setValue(option?.label || null)
  }

  /**
   * Charge les TJ
   */
  loadTj() {
    this.serverService.get('juridictions/get-all-visibles').then((data) => {
      this.tjs = data.data || []
      this.buildTjOptions()
    })
  }

  /**
   * Construit les options de juridictions et d'arrondissements
   */
  private buildTjOptions() {
    const list: JuridictionInterface[] = this.tjs.reduce((acc: JuridictionInterface[], tj: JuridictionInterface) => {
      const groupId = tj.group?.id
      if (groupId && !acc.find((t) => t.group?.id === groupId)) {
        acc.push({
          ...tj,
          id: groupId * -1,
          label: arrondissementLabel(tj.group, !this.userService.isCa()),
        })
      }

      acc.push(tj)

      return acc
    }, [])

    this.tjOptions = sortBy(
      list.map((tj) => ({
        id: tj.id,
        label: tj.label,
        groupId: tj.group?.id ?? null,
        groupLabel: tj.group ? arrondissementLabel(tj.group, !this.userService.isCa()) : '',
      })),
      ['groupId', 'label'],
    )
  }

  /**
   * Id du TJ / CA actuellement choisi
   */
  get selectedTjId(): number | null {
    const selectedLabel = this.form.controls['tj'].value
    return this.tjOptions.find((option) => option.label === selectedLabel)?.id ?? null
  }

  /**
   * Enregistre la valeur de TJ choisie
   * @param option
   */
  setTj(option: AutocompleteOption | null) {
    this.form.controls['tj'].setValue(option?.label || null)
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
   * Empêche la soumission depuis un champ, tout en gardant les boutons accessibles au clavier
   * @param event
   */
  preventSubmit(event: KeyboardEvent) {
    const target = event.target
    const isButton = target instanceof HTMLButtonElement || (target instanceof HTMLInputElement && target.type === 'submit')
    if (event.key === 'Enter' && !isButton) {
      event.preventDefault()
    }
  }

  /**
   * Trouve un <input> par formControlName via #input
   * @param name
   */
  private focusByControlName(name: string) {
    const ref = this.inputs.find((r) => r.nativeElement.getAttribute('formcontrolname') === name)
    ref?.nativeElement.focus()
  }

  /**
   * Evite problème de timing bloquant avec les alerts
   * @param fn
   */
  private focusSoon(fn: () => void) {
    setTimeout(fn, 0)
  }

  /**
   * Fonction de selection pour checkbox
   */
  private focusCheckboxSoon() {
    requestAnimationFrame(() => this.checkboxEl?.nativeElement?.focus())
  }
}
