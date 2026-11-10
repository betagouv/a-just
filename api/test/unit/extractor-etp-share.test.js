import { assert } from 'chai'
import { contentieuxChildToParent, expandHrByBackup } from '../../src/utils/extractor'
import { agentCountsOnBackup, agentKeptInBackupLoad } from '../../src/utils/agent-backup'

const AMIENS = 1
const ABBEVILLE = 2
const PERONNE = 3
const SOCIAL = 200
const AUTRES = 300
const SOUTIEN = 301

const childToParent = contentieuxChildToParent([{ id: AUTRES, childrens: [{ id: SOUTIEN }] }, { id: SOCIAL }, { id: 100 }])

const activity = (contentieuxId, percent, backupId) => ({
  percent,
  contentieux: { id: contentieuxId },
  backupId,
})

const line = (rows, backupId) => rows.find((row) => row.backupId === backupId)

describe('part d ETPT entre lieux', () => {
  const agent = {
    id: 7,
    backupId: PERONNE,
    situations: [
      {
        etp: 1,
        activities: [activity(100, 40, ABBEVILLE), activity(SOCIAL, 50, PERONNE), activity(AUTRES, 10, PERONNE), activity(SOUTIEN, 10, PERONNE)],
      },
    ],
  }

  it('ne compte pas le soutien déjà porté par Autres', () => {
    const rows = expandHrByBackup([agent], [ABBEVILLE, PERONNE], new Map(), childToParent)
    const peronne = line(rows, PERONNE)

    assert.closeTo(line(rows, ABBEVILLE).situations[0].etp, 0.4, 1e-9)
    assert.closeTo(peronne.situations[0].etp, 0.6, 1e-9)
    const [social, autres] = peronne.situations[0].activities.map((item) => item.percent)
    assert.closeTo(peronne.situations[0].etp * ((social + autres) / 100), peronne.situations[0].etp, 1e-9)
  })

})

describe('agent compté sur son backup d accueil', () => {
  const away = {
    backupId: AMIENS,
    situations: [{ activities: [activity(100, 40, ABBEVILLE), activity(SOCIAL, 60, PERONNE)] }],
  }

  it('retire l agent ventilé uniquement ailleurs de son backup d accueil', () => {
    assert.isFalse(agentCountsOnBackup(away, AMIENS))
    assert.isTrue(agentCountsOnBackup(away, ABBEVILLE))
  })

  it('garde l agent sans ventilation et celui ventilé sur son accueil', () => {
    assert.isTrue(agentCountsOnBackup({ backupId: AMIENS, situations: [{ activities: [] }] }, AMIENS))
    assert.isTrue(
      agentCountsOnBackup(
        { backupId: AMIENS, situations: [{ activities: [activity(SOCIAL, 30, AMIENS), activity(100, 70, PERONNE)] }] },
        AMIENS,
      ),
    )
  })

  it('le retire du seul accueil et le garde si un lieu ventilé est aussi demandé', () => {
    assert.isFalse(agentKeptInBackupLoad(away, AMIENS, new Set([AMIENS])))
    assert.isTrue(agentKeptInBackupLoad(away, AMIENS, new Set([AMIENS, ABBEVILLE, PERONNE])))
  })
})
