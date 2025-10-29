// Centralized, testable context getters/setters used by Sentry utilities.
// Avoids window globals and DOM coupling.

let jurisdictionTitle: string | null = null

export function setJurisdictionTitle(title: string | null): void {
  jurisdictionTitle = title ?? null
}

export function getJurisdictionTitle(): string | null {
  return jurisdictionTitle
}
