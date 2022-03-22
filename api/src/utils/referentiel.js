export function referentielMappingName (name) {
  switch(name) {
  case 'Soutien': return 'Soutien'
  case 'Indisponibilité': return 'Indisp.'
  case 'Siège Pénal': return 'Pénal'
  case 'Contentieux JAF': return 'JAF'
  case 'Contentieux Social': return 'Social'
  case 'Contentieux de la Protection': return 'JCP'
  case 'Juges des Enfants': return 'JE'
  case 'Civil Non Spécialisé': return 'Civil NS'
  case 'Juges d\'Instruction': return 'JI'
  }

  return name
}

export function referentielMappingColor (name) {
  switch(name) {
  case 'Soutien': return '#424242'
  case 'Indisponibilité': return '#37474f'
  case 'Siège Pénal': return '#c62828'
  case 'Contentieux JAF': return '#0277bd'
  case 'Contentieux Social': return '#00838f'
  case 'Contentieux de la Protection': return '#1565c0'
  case 'Juges des Enfants': return '#6a1b9a'
  case 'Civil Non Spécialisé': return '#283593'
  case 'Juges d\'Instruction': return '#d84315'
  case 'JLD Civil': return '#4527a0'
  case 'JAP': return '#ef6c00'
  case 'JLD pénal': return '#ff8f00'
  case 'JLD civil': return '#4527a0'
  }

  return ''
}

export function referentielMappingIndex (name) {
  switch(name) {
  case 'Soutien': return 12
  case 'Indisponibilité': return 13
  case 'Siège Pénal': return 8
  case 'Contentieux JAF': return 2
  case 'Contentieux Social': return 1
  case 'Contentieux de la Protection': return 3
  case 'Juges des Enfants': return 7
  case 'Civil Non Spécialisé': return 4
  case 'Juges d\'Instruction': return 9
  case 'JLD Civil': return 6
  case 'JAP': return 10
  case 'JLD pénal': return 11
  case 'JLD civil': return 5
  }

  return 0
}

export function getIdsIndispo (list) {
  const refIndispo = list.find((r) => r.label === 'Indisponibilité')
  const idsIndispo = []
  if (refIndispo) {
    idsIndispo.push(refIndispo.id);
    (refIndispo.childrens || []).map((c) => {
      idsIndispo.push(c.id)
    })
  }
  
  return idsIndispo
}