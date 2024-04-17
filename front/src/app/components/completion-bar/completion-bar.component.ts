import { AfterViewInit, Component, ElementRef, Input, OnInit } from '@angular/core'
import { AppService } from 'src/app/services/app/app.service'
import { v4 as uuidv4 } from 'uuid'

/**
 * Composant de génération des tooltips
 */

@Component({
  selector: 'aj-completion-bar',
  templateUrl: './completion-bar.component.html',
  styleUrls: ['./completion-bar.component.scss'],
})
export class CompletionBarComponent implements OnInit {

  @Input() value: number = 0
  /**
   * Initialisation du composant
   */
    ngOnInit(): void {
      //console.log('Completion Value:', this.value)
      //this.onDraw()
    }
}
