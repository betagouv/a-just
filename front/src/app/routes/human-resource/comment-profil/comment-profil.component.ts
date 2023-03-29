import { Component, Input } from '@angular/core'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { MainClass } from 'src/app/libs/main-class'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'comment-profil',
  templateUrl: './comment-profil.component.html',
  styleUrls: ['./comment-profil.component.scss'],
})
export class CommentProfilComponent extends MainClass {
  /**
   * Fiche courante
   */
  @Input() currentHR: HumanResourceInterface | null = null

  /**
   * Constructeur
   * @param humanResourceService
   */
  constructor(private humanResourceService: HumanResourceService) {
    super()
  }
}
