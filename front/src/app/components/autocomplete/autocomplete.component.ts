import { CommonModule } from '@angular/common'
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core'
import { FormControl, ReactiveFormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'

/**
 * Option d'autocomplétion, éventuellement rattachée à un groupe
 */
export interface AutocompleteOption {
  id: number
  label: string
  groupId?: number | null
  groupLabel?: string
}

/**
 * Groupe d'options affiché dans le panneau
 */
export interface AutocompleteGroup {
  id: number | null
  label: string
  options: AutocompleteOption[]
}

/**
 * Autocomplétion générique, inspirée de Angular Material Autocomplete
 */
@Component({
  selector: 'aj-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent implements OnChanges, OnDestroy {
  private static openInstance: AutocompleteComponent | null = null
  @ViewChild('input') inputRef: ElementRef<HTMLInputElement> | null = null
  @ViewChild('panel') panelRef: ElementRef<HTMLElement> | null = null

  /**
   * Liste des options
   */
  @Input() options: AutocompleteOption[] = []
  /**
   * Texte du placeholder
   */
  @Input() placeholder = ''
  /**
   * Id de l'option sélectionnée
   */
  @Input() value: number | null = null
  /**
   * Option sélectionnée
   */
  @Output() optionChange = new EventEmitter<AutocompleteOption | null>()

  searchControl = new FormControl('')
  filteredGroups: AutocompleteGroup[] = []
  isOpen = false
  highlightedIndex = -1

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node
    if (this.inputRef?.nativeElement.contains(target) || this.panelRef?.nativeElement.contains(target)) {
      return
    }
    this.closePanel()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] || changes['value']) {
      this.syncInputFromValue()
      this.filteredGroups = this.filterGroups(this.getQuery())
    }
  }

  ngOnDestroy() {
    if (AutocompleteComponent.openInstance === this) {
      AutocompleteComponent.openInstance = null
    }
  }

  /**
   * Filtre les groupes à la saisie
   */
  onSearch() {
    this.filteredGroups = this.filterGroups(this.getQuery())
    this.highlightedIndex = this.flatOptions().length ? 0 : -1
    this.openPanel()
  }

  /**
   * Ouvre le panneau
   */
  onInputFocus() {
    this.filteredGroups = this.filterGroups(this.getQuery())
    this.openPanel()
  }

  /**
   * Navigation clavier
   */
  onKeydown(event: KeyboardEvent) {
    const options = this.flatOptions()

    if (event.key === 'Escape') {
      this.closePanel()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.openPanel()
      this.highlightedIndex = Math.min(this.highlightedIndex + 1, options.length - 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = options[this.highlightedIndex]
      if (option) {
        this.selectOption(option)
      }
    }
  }

  /**
   * Sélection d'une option
   */
  selectOption(option: AutocompleteOption) {
    this.searchControl.setValue(option.label, { emitEvent: false })
    this.optionChange.emit(option)
    this.closePanel()
  }

  /**
   * Vide la sélection si l'utilisateur efface le champ
   */
  onInputBlur() {
    setTimeout(() => {
      if (this.isOpen) return

      const query = this.getQuery()
      const selected = this.selectedOption()

      if (!query) {
        if (this.value != null) {
          this.optionChange.emit(null)
        }
        return
      }

      if (selected && selected.label.toLowerCase() === query) {
        this.searchControl.setValue(selected.label, { emitEvent: false })
        return
      }

      const exact = this.options.find((option) => option.label.toLowerCase() === query)
      if (exact) {
        this.searchControl.setValue(exact.label, { emitEvent: false })
        if (exact.id !== this.value) {
          this.optionChange.emit(exact)
        }
        return
      }

      this.syncInputFromValue()
    })
  }

  /**
   * Focus le champ de recherche
   */
  focus() {
    this.inputRef?.nativeElement.focus()
  }

  isHighlighted(option: AutocompleteOption) {
    return this.flatOptions()[this.highlightedIndex]?.id === option.id
  }

  private openPanel() {
    if (AutocompleteComponent.openInstance && AutocompleteComponent.openInstance !== this) {
      AutocompleteComponent.openInstance.closePanel()
    }

    AutocompleteComponent.openInstance = this
    this.isOpen = true
  }

  private closePanel() {
    this.isOpen = false
    this.highlightedIndex = -1

    if (AutocompleteComponent.openInstance === this) {
      AutocompleteComponent.openInstance = null
    }
  }

  private selectedOption() {
    return this.options.find((option) => option.id === this.value) || null
  }

  private syncInputFromValue() {
    const selected = this.selectedOption()
    this.searchControl.setValue(selected?.label || '', { emitEvent: false })
  }

  private getQuery() {
    return (this.searchControl.value || '').trim().toLowerCase()
  }

  private flatOptions() {
    return this.filteredGroups.flatMap((group) => group.options)
  }

  private filterGroups(query: string): AutocompleteGroup[] {
    const groups = this.buildGroups()

    if (!query) return groups

    return groups
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(query)
        return {
          ...group,
          options: groupMatches ? group.options : group.options.filter((option) => option.label.toLowerCase().includes(query)),
        }
      })
      .filter((group) => group.options.length > 0)
  }

  private buildGroups(): AutocompleteGroup[] {
    const groupsById = new Map<number, AutocompleteGroup>()
    const ungrouped: AutocompleteOption[] = []

    this.options.forEach((option) => {
      if (option.groupId == null || !option.groupLabel) {
        ungrouped.push(option)
        return
      }

      const existing = groupsById.get(option.groupId)
      if (existing) {
        existing.options.push(option)
        return
      }

      groupsById.set(option.groupId, {
        id: option.groupId,
        label: option.groupLabel,
        options: [option],
      })
    })

    const groups = Array.from(groupsById.values()).sort((a, b) => a.label.localeCompare(b.label, 'fr'))

    if (ungrouped.length) {
      groups.push({
        id: null,
        label: '',
        options: ungrouped,
      })
    }

    return groups
  }
}
