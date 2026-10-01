/**
 * Format de l'arrondissement en fonction du nom
 * d' / de / du
 */
export function formatGroupLabel(group: { label?: string } | null | undefined) {
  const label = (group?.label || '').trim().replace(/^arrondissement\s+/i, '')

  if (!label) return ''

  if (/^le\s+/i.test(label)) {
    return label.replace(/^le\s+/i, 'du ')
  }

  if (/^[aeiouyàâäéèêëîïôöùûüÿœæ]/i.test(label)) {
    return `d'${label}`
  }

  return `de ${label}`
}

/**
 * Intitulé d'un arrondissement dans les menus : "Arr. du TJ / de la CA" + nom
 */
export function arrondissementLabel(group: { label?: string } | null | undefined, isTJ: boolean) {
  const name = formatGroupLabel(group)
  return name ? `Arr. ${isTJ ? 'du TJ' : 'de la CA'} ${name}` : 'Arr.'
}
