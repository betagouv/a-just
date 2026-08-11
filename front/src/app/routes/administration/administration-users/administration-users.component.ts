import { Component, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import sortBy from 'lodash/sortBy'
import { MainClass } from '../../../libs/main-class'
import { UserService } from '../../../services/user/user.service'
import { inject } from '@angular/core'
import { UserInterface } from '../../../interfaces/user-interface'
import { accessToString, CATEGORIES_ACCESS_IDS, PAGES_ACCESS_IDS, USER_ACCESS_LIST } from '../../../constants/user-access'
import { SanitizeHtmlPipe } from '../../../pipes/sanitize-html/sanitize-html.pipe'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
/**
 * List des utilisateurs de la juridiction
 */
@Component({
  selector: 'administration-users',
  standalone: true,
  imports: [CommonModule, SanitizeHtmlPipe],
  templateUrl: './administration-users.component.html',
  styleUrls: ['./administration-users.component.scss'],
})
export class AdministrationUsersComponent extends MainClass implements OnInit, OnDestroy {
  editedUsers: Record<number, { access: number[]; referentielIds: number[] }> = {}

  /**
   * Service pour gérer les utilisateurs
   */
  userService = inject(UserService)
  /**
   * Referentiel service
   */
  humanResourceService = inject(HumanResourceService)
  /**
   * Liste des utilisateurs de la juridiction
   */
  users: UserInterface[] = []
  /**
   * On edit un ou plusieurs utilisateurs
   */
  onEditUserIds: number[] = []
  /**
   * Referentiels
   */
  referentiels: ContentieuReferentielInterface[] = []
  /**
   * Pages access ids
   */
  PAGES_ACCESS_IDS = PAGES_ACCESS_IDS
  /**
   * Categories access ids
   */
  CATEGORIES_ACCESS_IDS = CATEGORIES_ACCESS_IDS
  /**
   * Function to convert access id to string
   */
  accessToString = accessToString
  /**
   * Liste des accès possible
   */
  USER_ACCESS_LIST = USER_ACCESS_LIST

  constructor() {
    super()
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((contentieuxReferentiel) => {
        this.referentiels = contentieuxReferentiel.filter((c) => !this.humanResourceService.allIndisponibilityReferentielIds.includes(c.id))
      }),
    )

    this.onLoad()
  }

  ngOnDestroy() {
    this.watcherDestroy()
  }

  toggleUserDetails(user: UserInterface) {
    const userId = user.id

    if (!userId) {
      return
    }

    if (this.onEditUserIds.includes(userId)) {
      this.onEditUserIds = this.onEditUserIds.filter((id) => id !== userId)
      return
    }

    this.editedUsers[userId] = {
      access: [...(user.access || [])],
      referentielIds: [...(user.referentielIds || this.referentiels.map((referentiel) => referentiel.id))],
    }

    this.onEditUserIds = [...this.onEditUserIds, userId]
  }

  hasAccess(userId: number | undefined, accessId: number) {
    if (!userId) {
      return false
    }

    return this.editedUsers[userId]?.access.includes(accessId) || false
  }

  showAccessByOrder(userId: number | undefined, accessRow: { orderRequired?: boolean; access: { id: number }[] }, accessIndex: number) {
    if (!accessRow.orderRequired) {
      return true
    }

    if (accessIndex === 0) {
      return true
    }

    return this.hasAccess(userId, accessRow.access[accessIndex - 1].id)
  }

  hasReferentielAccess(userId: number | undefined, referentielId: number) {
    if (!userId) {
      return false
    }

    return this.editedUsers[userId]?.referentielIds.includes(referentielId) || false
  }

  onToggleAccess(userId: number | undefined, accessId: number, checked: boolean) {
    if (!userId || !this.editedUsers[userId]) {
      return
    }

    if (checked) {
      if (!this.editedUsers[userId].access.includes(accessId)) {
        this.editedUsers[userId].access = [...this.editedUsers[userId].access, accessId]
      }
      return
    }

    this.editedUsers[userId].access = this.editedUsers[userId].access.filter((id) => id !== accessId)
  }

  onToggleReferentiel(userId: number | undefined, referentielId: number, checked: boolean) {
    if (!userId || !this.editedUsers[userId]) {
      return
    }

    if (checked) {
      if (!this.editedUsers[userId].referentielIds.includes(referentielId)) {
        this.editedUsers[userId].referentielIds = [...this.editedUsers[userId].referentielIds, referentielId]
      }
      return
    }

    this.editedUsers[userId].referentielIds = this.editedUsers[userId].referentielIds.filter((id) => id !== referentielId)
  }

  async onLoad() {
    this.users = sortBy(await this.userService.getUsersJuridictions(), [
      function (o) {
        return (o?.lastName || '').toLocaleLowerCase()
      },
      function (o) {
        return (o?.firstName || '').toLocaleLowerCase()
      },
    ])
  }

  getUserPagesAccessToString(accessIds: number[]) {
    if (accessIds.length === 0) {
      return 'Aucun'
    }

    const list: number[] = []
    USER_ACCESS_LIST.map((accessRow) => {
      accessRow.access.map((access, accessIndex) => {
        if (!accessIds.includes(access.id)) {
          return
        }

        if (accessRow.orderRequired && accessIndex > 0) {
          const previousAccess = accessRow.access[accessIndex - 1]
          if (!accessIds.includes(previousAccess.id)) {
            return
          }
        }

        if (PAGES_ACCESS_IDS.includes(access.id)) {
          list.push(access.id)
        }
      })
    })

    PAGES_ACCESS_IDS.map((pageId) => {
      if (!list.includes(pageId) && accessIds.includes(pageId)) {
        list.push(pageId)
      }
    })

    return list.length === PAGES_ACCESS_IDS.length ? 'Toutes' : list.map((accessId) => accessToString(accessId)).join(',<br/>')
  }

  getUserCategoriesAccessToString(accessIds: number[]) {
    if (accessIds.length === 0) {
      return 'Aucun'
    }

    const list: number[] = []
    CATEGORIES_ACCESS_IDS.map((categoryId) => {
      if (accessIds.includes(categoryId)) {
        list.push(categoryId)
      }
    })

    return list.length === CATEGORIES_ACCESS_IDS.length ? 'Tous' : list.map((accessId) => accessToString(accessId)).join(',<br/>')
  }

  getUserContentieuxAccessToString(referentielIds: number[] | null = null) {
    const list: ContentieuReferentielInterface[] = []

    if (referentielIds === null) {
      return 'Tous'
    }

    this.referentiels.map((referentiel) => {
      if (referentielIds.includes(referentiel.id)) {
        list.push(referentiel)
      }
    })

    return list.length === this.referentiels.length ? 'Tous' : list.map((referentiel) => referentiel.label).join(',<br/>')
  }

  async onUpdateById(userId: number) {
    const userEdition = this.editedUsers[userId] || { access: [], referentielIds: [] }
    let newRefIds: any = userEdition.referentielIds || []
    if (newRefIds.length === this.referentiels.length) {
      newRefIds = null
    }

    console.log('onUpdateById', {
      userId,
      access: userEdition.access,
      referentielIds: newRefIds,
    })

    if (confirm("Confirmer la modification des accès de l'utilisateur ?")) {
      await this.userService.updatePersonByLocalAdmin({ userId, access: userEdition.access, referentielIds: newRefIds })

      const userIndex = this.users.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        this.users[userIndex].access = [...userEdition.access]
        this.users[userIndex].referentielIds = [...userEdition.referentielIds]

        delete this.editedUsers[userId]
        this.onEditUserIds = this.onEditUserIds.filter((id) => id !== userId)
      }
    }

    return userEdition
  }
}
