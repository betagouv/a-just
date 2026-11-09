import type { Workbook } from 'exceljs'
import { arrondissementLabel } from '../../utils/arrondissement'

interface EtptSummaryViewModel {
  uniqueJur: string[]
  tProximite: string[]
  arrondissementExport?: { id: number; label: string } | null
}

/** Configure uniquement le sélecteur et les agrégats de l'onglet Synthèse ETPT. */
export function configureEtptSummary(report: Workbook, viewModel: EtptSummaryViewModel, isTJ: boolean) {
  const summary = report.getWorksheet('Synthèse ETPT')!
  const group = viewModel.arrondissementExport
  let formulae = viewModel.tProximite

  if (group) {
    // Une plage dédiée conserve les libellés exacts et évite la limite des listes Excel en ligne.
    // tProximite reste réservé aux juridictions, notamment pour l'affectation des agents.
    const jurisdictions = report.getWorksheet('Juridictions')!
    const options = [arrondissementLabel(group, isTJ).toUpperCase(), ...viewModel.uniqueJur]
    jurisdictions.getCell('O1').value = 'Périmètre de la synthèse ETPT'
    options.forEach((option, index) => {
      jurisdictions.getCell(`O${index + 2}`).value = option
    })
    report.definedNames.add(`Juridictions!$O$2:$O$${options.length + 1}`, 'SyntheseEtptJuridictions')
    formulae = ['SyntheseEtptJuridictions']

    // Le sélecteur est masqué dans le modèle CA tant qu'il ne propose qu'une juridiction.
    summary.getColumn('A').hidden = false
    const selection = summary.getCell('A3')
    selection.alignment = { ...selection.alignment, wrapText: true }
    summary.getRow(3).height = Math.max(summary.getRow(3).height || 0, 60)

    // Le modèle TJ filtre déjà chaque SUMIFS par juridiction. Le modèle CA ne le fait pas.
    // Retirer seulement ce critère conserve les règles métier des catégories et fonctions.
    const jurisdictionFilter = /,\s*INDEX\(\s*'ETPT Format DDG'!\$A:\$ZZ,,MATCH\("Juridiction",'ETPT Format DDG'!\$?2:\$?2,0\)\),\s*\$A\$3/g
    const jurisdictionRange = `INDEX('ETPT Format DDG'!$A:$ZZ,,MATCH("Juridiction",'ETPT Format DDG'!$2:$2,0))`
    summary.eachRow((row) => {
      row.eachCell((cell) => {
        const formula = cell.formula?.replace(/^=/, '')
        if (!formula?.startsWith('SUMIFS(')) return

        const totalFormula = formula.replace(jurisdictionFilter, '')
        const individualFormula = totalFormula !== formula ? formula : `${formula.slice(0, -1)},${jurisdictionRange},$A$3)`
        cell.value = { formula: `IF($A$3=Juridictions!$O$2,${totalFormula},${individualFormula})` }
      })
    })
    report.calcProperties.fullCalcOnLoad = true
  }

  summary.getCell('A3').dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae,
    error: 'Veuillez sélectionner une valeur dans le menu déroulant',
    prompt: group
      ? "Sélectionner l'arrondissement ou une juridiction pour mettre à jour le tableau de synthèse ci-après"
      : 'Sélectionner une juridiction pour mettre à jour le tableau de synthèse ci-après',
    showErrorMessage: true,
    showInputMessage: true,
  }
}
