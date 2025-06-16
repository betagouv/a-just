class IntervalTreeNode {
  constructor(start, end, period) {
    this.start = start
    this.end = end
    this.period = period
    this.left = null
    this.right = null
    this.maxEnd = end // Garde la valeur maximale de la fin pour chaque sous-arbre
  }
}

export class IntervalTree {
  constructor() {
    this.root = null
  }

  // Insérer une nouvelle période dans l'arbre
  insert(start, end, period) {
    this.root = this._insert(this.root, start, end, period)
  }

  _insert(node, start, end, period) {
    if (!node) {
      return new IntervalTreeNode(start, end, period)
    }

    if (start < node.start) {
      node.left = this._insert(node.left, start, end, period)
    } else {
      node.right = this._insert(node.right, start, end, period)
    }

    node.maxEnd = Math.max(node.maxEnd, end)
    return node
  }

  // Rechercher les périodes chevauchantes dans un intervalle [queryStart, queryEnd]
  search(queryStart, queryEnd) {
    const matchedPeriods = []
    this._search(this.root, queryStart, queryEnd, matchedPeriods)
    return matchedPeriods
  }

  _search(node, queryStart, queryEnd, matchedPeriods) {
    if (!node) {
      return
    }

    const { start, end, period } = node

    // Si la période chevauche l'intervalle de recherche
    if (
      start <= queryEnd &&
      end >= queryStart // Les intervalles se chevauchent
    ) {
      matchedPeriods.push(period)
    }

    // Si il existe un sous-arbre gauche à explorer
    if (node.left && node.left.maxEnd >= queryStart) {
      this._search(node.left, queryStart, queryEnd, matchedPeriods)
    }

    // On explore le sous-arbre droit si nécessaire
    if (node.right && queryEnd >= node.start) {
      this._search(node.right, queryStart, queryEnd, matchedPeriods)
    }
  }
}

export const searchPeriodsWithIntervalTree = (intervalTree, queryStart, queryEnd) => {
  const matchedPeriods = intervalTree.search(new Date(queryStart), new Date(queryEnd))
  return matchedPeriods
}

export const createIndex = (agentsPeriodsMap) => {
  const intervalTree = new IntervalTree() // Arbre d'intervalle
  const categoryIndex = new Map() // Index par catégorie
  const functionIndex = new Map() // Index par fonction
  const contentieuxIndex = new Map() // Index par contentieux

  // Itérer sur chaque agent et ses périodes
  agentsPeriodsMap.forEach((periods, agentId) => {
    periods.forEach((period) => {
      const start = new Date(period.start)
      const end = new Date(period.end)

      // Insérer chaque période dans l'arbre d'intervalle
      intervalTree.insert(start, end, {
        agentId,
        start: period.start,
        end: period.end,
        effectiveETP: period.effectiveETP,
        etp: period.etp,
      })

      // --- Indexation par catégorie ---
      const { category } = period
      if (!categoryIndex.has(category.id)) {
        categoryIndex.set(category.id, [])
      }
      categoryIndex.get(category.id).push({
        agentId,
        start: period.start,
        end: period.end,
        effectiveETP: period.effectiveETP,
        etp: period.etp,
        categoryId: category.id,
      })

      // --- Indexation par fonction ---
      const { fonction } = period
      if (!functionIndex.has(fonction.id)) {
        functionIndex.set(fonction.id, [])
      }
      functionIndex.get(fonction.id).push({
        agentId,
        start: period.start,
        end: period.end,
        effectiveETP: period.effectiveETP,
        etp: period.etp,
        fonctionId: fonction.id,
      })

      // --- Indexation par contentieux ---
      period.activities.forEach((activity) => {
        const { contentieux } = activity
        if (!contentieuxIndex.has(contentieux.id)) {
          contentieuxIndex.set(contentieux.id, [])
        }
        contentieuxIndex.get(contentieux.id).push({
          agentId,
          start: period.start,
          end: period.end,
          effectiveETP: period.effectiveETP,
          etp: period.etp,
          contentieuxId: contentieux.id,
        })
      })
    })
  })

  // Retourner l'intervalTree et les trois autres index
  return {
    intervalTreeX: intervalTree,
    categoryIndexX: categoryIndex,
    functionIndexX: functionIndex,
    contentieuxIndexX: contentieuxIndex,
  }
}
