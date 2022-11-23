export const getCategoryColor = (label, opacity = 1) => {
  switch (label) {
  case 'Magistrat':
  case 'Magistrats':
  case 'Magistrat du siège':
  case 'Magistrats du siège':
    return `rgba(0, 0, 145, ${opacity})`
  case 'Fonctionnaire':
  case 'Fonctionnaires':
    return `rgba(165, 88, 160, ${opacity})`
  }

  return `rgba(239, 203, 58, ${opacity})`
}

export const MAGISTRATS = 'magistrats'
export const FONCTIONNAIRES = 'fonctionnaires'
