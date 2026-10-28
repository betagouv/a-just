import { DOCUMENT } from '@angular/common'
import { Inject, Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class DocumentScrollLockService {
  private activeLocks = 0
  private originalHtmlOverflow = ''
  private originalBodyOverflow = ''

  constructor(@Inject(DOCUMENT) private document: Document) {}

  acquire(): void {
    if (this.activeLocks === 0) {
      this.originalHtmlOverflow = this.document.documentElement.style.overflow
      this.originalBodyOverflow = this.document.body.style.overflow
      this.document.documentElement.style.overflow = 'hidden'
      this.document.body.style.overflow = 'hidden'
    }

    this.activeLocks += 1
  }

  release(): void {
    if (this.activeLocks === 0) {
      return
    }

    this.activeLocks -= 1
    if (this.activeLocks === 0) {
      this.document.documentElement.style.overflow = this.originalHtmlOverflow
      this.document.body.style.overflow = this.originalBodyOverflow
    }
  }
}
