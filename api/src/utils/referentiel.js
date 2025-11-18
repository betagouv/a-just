/**
 * Mapping des contentieux/sous contentieux
 * @param {*} name
 * @returns
 */
export function referentielMappingName(name) {
  switch (name) {
    case 'Autres activités':
      return 'Autres activités'
    case 'Indisponibilité':
      return 'Indisp.'
    case 'Siège Pénal':
      return 'Pénal'
    case 'Contentieux JAF':
      return 'JAF'
    case 'Contentieux Social':
      return 'Social'
    case 'Contentieux de la Protection':
      return 'JCP'
    case 'Juges des Enfants':
      return 'JE'
    case 'Civil Non Spécialisé':
      return 'Civil NS'
    case "Juges d'Instruction":
      return 'JI'
  }

  return name
}

export function referentielCAMappingName(name) {
  switch (name) {
    case 'Contentieux Social':
      return 'Social'
    case 'Contentieux de la famille':
      return 'Famille'
    case 'Contentieux de la protection':
      return 'Protection'
    case 'Contentieux civil':
      return 'Civil NS'
    case 'Contentieux de la protection':
      return 'Civil NS'
    case 'Contentieux commercial':
      return 'Commercial'
    case 'Attributions du PP':
      return 'Attributions PP'
    case 'Contentieux civil JLD':
      return 'Jld Civil'
    case 'Contentieux des mineurs':
      return 'Mineurs'
    case 'Instruction et entraide':
      return 'Instruction / Entraide'
    case 'Correctionnel':
      return 'Correctionnel'
    case 'Contentieux criminel':
      return 'Criminel'
    case 'Application des peines':
      return 'Application des peines'
    case 'Autres activités':
      return 'Autres activités'
  }

  return name
}

/**
 * Mapping des couleurs propres au référentiel
 * @param {*} name
 * @returns
 */
export function referentielMappingColor(name) {
  switch (name) {
    case 'Autres activités':
      return '#424242'
    case 'Indisponibilité':
      return '#37474f'
    case 'Siège Pénal':
      return '#c62828'
    case 'Contentieux JAF':
      return '#0277bd'
    case 'Contentieux Social':
      return '#00838f'
    case 'Contentieux de la Protection':
      return '#1565c0'
    case 'Juges des Enfants':
      return '#6a1b9a'
    case 'Civil Non Spécialisé':
      return '#283593'
    case "Juges d'Instruction":
      return '#d84315'
    case 'JLD Civil':
      return '#4527a0'
    case 'JAP':
      return '#ef6c00'
    case 'JLD pénal':
      return '#ff8f00'
    case 'JLD civil':
      return '#4527a0'
  }

  return ''
}

/**
 * Récupère les ids d'indisponibilités
 * @param {*} list
 * @returns
 */
export function getIdsIndispo(list) {
  const refIndispo = list.find((r) => r.label === 'Indisponibilité')
  const idsIndispo = []
  if (refIndispo) {
    idsIndispo.push(refIndispo.id)
    ;(refIndispo.childrens || []).map((c) => {
      idsIndispo.push(c.id)
    })
  }

  return idsIndispo
}

/**
 * Extraction des codes contenus dans un label
 * @param {*} label
 * @returns
 */
export function extractCodeFromLabelImported(label) {
  const regex = new RegExp('([0-9.]*)(.*)')
  const regexExec = regex.exec(label)
  if (regexExec) {
    return {
      code: regexExec[1],
      label: (regexExec[2] + '').trim(),
    }
  }

  return null
}

/**
 * Modifie les labels d'un referentiel en fonction de la regle JIRS NON JIRS
 * @param {*} list
 * @param {*} isJirs
 * @returns
 */
export function jirsRules(list, isJirs) {
  if (isJirs === false) {
    list.map((elem) => {
      elem.childrens.map((child) => {
        switch (child.label) {
          case 'Contentieux collégial hors JIRS': //NEW CA
            child.label = 'Contentieux collégial'
            break
          case 'Contentieux JIRS éco-fi':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Contentieux JIRS éco-fi')
            break
          case 'Contentieux JIRS crim-org':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Contentieux JIRS crim-org')
            break

          case 'Collégiales hors JIRS':
            child.label = 'Collégiales'
            break
          case "Cour d'assises hors JIRS":
            child.label = "Cour d'assises"
            break
          case "Cour d'assises JIRS":
            elem.childrens = elem.childrens.filter((elem) => elem.label !== "Cour d'assises JIRS")
            break
          case 'Collégiales JIRS crim-org':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Collégiales JIRS crim-org')
            break
          case 'Collégiales JIRS éco-fi':
            child.label = 'Collégiales éco-fi'
            break
          case 'Eco-fi hors JIRS':
            child.label = 'Eco-fi'
            break
          case 'JIRS éco-fi':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'JIRS éco-fi')
            break
          case 'JIRS crim-org':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'JIRS crim-org')
            break
          case 'JIRS':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'JIRS')
            break
          case 'Assises JIRS':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Assises JIRS')
            break
          case 'Contentieux JIRS':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Contentieux JIRS')
            break
          case 'Contentieux de la détention JIRS':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Contentieux de la détention JIRS')
            break
          case 'Contentieux du contrôle judiciaire JIRS':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Contentieux du contrôle judiciaire JIRS')
            break
          case 'Contentieux de fond JIRS':
            elem.childrens = elem.childrens.filter((elem) => elem.label !== 'Contentieux de fond JIRS')
            break
          case 'Contentieux général hors JIRS':
            child.label = 'Contentieux général'
            break
          case 'Contentieux spécialisés hors JIRS':
            child.label = 'Contentieux spécialisés'
            break
          case 'Contentieux de la détention hors JIRS':
            child.label = 'Contentieux de la détention'
            break
          case 'Contentieux du contrôle judiciaire hors JIRS':
            child.label = 'Contentieux du contrôle judiciaire'
            break
          case 'Contentieux de fond hors JIRS':
            child.label = 'Contentieux de fond'
            break
          case 'Assises hors JIRS':
            child.label = 'Assises'
            break
        }
      })
    })
  }
  return list
}

function construireMapLabels(listeRef) {
  const map = new Map()

  function parcourir(items) {
    items.forEach((item) => {
      if (item.id && item.label) {
        map.set(item.id, item.label)
      }
      if (Array.isArray(item.childrens)) {
        parcourir(item.childrens)
      }
    })
  }

  parcourir(listeRef)
  return map
}

export function updateLabels(listeA, listeReference) {
  const mapLabels = construireMapLabels(listeReference)

  const listeFiltree = listeA.filter((item) => {
    const idContentieux = item.contentieux?.id
    if (!idContentieux) return false
    return mapLabels.has(idContentieux)
  })

  listeFiltree.forEach((item) => {
    const idContentieux = item.contentieux.id
    item.contentieux.label = mapLabels.get(idContentieux)
  })

  return listeFiltree
}

// ---- 1) Formatage d'un item "vide" au format GroupedList à partir d'un référentiel
export function makeEmptyItemFromRef(ref, periode, fill = null) {
  return {
    periode,
    id: undefined,
    entrees: fill,
    sorties: fill,
    stock: null,
    originalEntrees: fill,
    originalSorties: fill,
    originalStock: null,
    idReferentiel: ref.id,
    contentieux: {
      id: ref.id,
      label: ref.label ?? null,
      code_import: ref.code_import ?? null,
    },
  }
}

// ---- 2) Compléter un tableau (pour UNE période) avec les référentiels manquants
export function completePeriod(items, flatReferentielsList, periode, fill = null) {
  const existingIds = new Set(items.map((i) => i?.contentieux?.id ?? i?.idReferentiel))
  const completed = [...items, ...flatReferentielsList.filter((ref) => !existingIds.has(ref.id)).map((ref) => makeEmptyItemFromRef(ref, periode, fill))]
  return completed
}

// ---- 3) Parcourir tout l'objet groupé par période et appliquer completePeriod
export function fillMissingContentieux(GroupedList, flatReferentielsList) {
  const out = {}
  for (const [periode, items] of Object.entries(GroupedList || {})) {
    out[periode] = completePeriod(items || [], flatReferentielsList || [], periode)
  }
  return out
}

function toUpper(s) {
  return (s ?? '').toString().toUpperCase()
}

/**
 * Construit un Map<id, label> à partir d'une liste de refs.
 *
 * @param {Array<{id:string|number, label:string, code_import:string, childrens?:Array<any>}>} refs
 * @param {{ stringifyKeys?: boolean }} [options] - si true, force les clés en string (évite les confusions "1" vs 1)
 * @returns {Map<string|number, string>}
 */
export function buildIdToLabelMap(refs, { stringifyKeys = true } = {}) {
  const idToLabel = new Map()

  for (let i = 0, n = refs?.length || 0; i < n; i++) {
    const r = refs[i]
    if (!r || r.id == null) continue

    const label = r.childrens && r.childrens.length ? `${r.code_import} TOTAL ${toUpper(r.label)}` : `${r.code_import} ${toUpper(r.label)}`

    const key = stringifyKeys ? String(r.id) : r.id
    idToLabel.set(key, label)
  }

  return idToLabel
}
