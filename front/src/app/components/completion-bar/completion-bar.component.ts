import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

/**
 * Composant de génération des tooltips
 */

@Component({
  selector: 'aj-completion-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './completion-bar.component.html',
  styleUrls: ['./completion-bar.component.scss'],
})
export class CompletionBarComponent implements OnInit {
  @Input() value: number = 0;
  /**
   * Initialisation du composant
   */
  ngOnInit(): void {
    //console.log('Completion Value:', this.value)
    //this.onDraw()
  }
}
