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
    case "Contentieux Social":
      return "Social";
    case "Contentieux de la famille":
      return "Famille";
    case "Contentieux de la protection":
      return "Protection";
    case "Contentieux civil":
      return "Civil NS";
    case "Contentieux de la protection":
      return "Civil NS";
    case "Contentieux commercial":
      return "Commercial";
    case "Attributions du PP":
      return "Attributions PP";
    case "Contentieux civil JLD":
      return "Jld Civil";
    case "Contentieux des mineurs":
      return "Mineurs";
    case "Instruction et entraide":
      return "Instruction / Entraide";
    case "Correctionnel":
      return "Correctionnel";
    case "Contentieux criminel":
      return "Criminel";
    case "Application des peines":
      return "Application des peines";
    case "Autres activités":
      return "Autres activités";
  }

  return name;
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
      ; (refIndispo.childrens || []).map((c) => {
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
