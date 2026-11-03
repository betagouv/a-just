import { ContentieuReferentielInterface } from '../interfaces/contentieu-referentiel'
import { sumCountedActivityValues } from './activity'

const child = (values: Partial<ContentieuReferentielInterface>): ContentieuReferentielInterface => ({
  id: 1, label: 'JAP', averageProcessingTime: null, ...values,
})

describe('Sommes des données d’activité', () => {
  it('exclut les cases décochées et les anciennes valeurs null', () => {
    const children = [
      child({ compter: true, in: 10, out: 8, stock: 20 }),
      child({ compter: false, in: 100, out: 80, stock: 200 }),
      child({ compter: null, originalIn: 1000, originalOut: 800, originalStock: 2000 }),
    ]
    expect(sumCountedActivityValues(children, ['in', 'originalIn'])).toBe(10)
    expect(sumCountedActivityValues(children, ['out', 'originalOut'])).toBe(8)
    expect(sumCountedActivityValues(children, ['stock', 'originalStock'])).toBe(20)
  })

  it('privilégie les ajustements, y compris zéro, puis les données logiciel', () => {
    const children = [child({ compter: true, in: 0, originalIn: 100 }), child({ compter: true, in: null, originalIn: 12 })]
    expect(sumCountedActivityValues(children, ['in', 'originalIn'])).toBe(12)
  })

  it('préserve les données absentes et borne les sommes négatives à zéro', () => {
    expect(sumCountedActivityValues([child({ compter: false, in: 10 })], ['in', 'originalIn'])).toBeNull()
    expect(sumCountedActivityValues([child({ compter: true })], ['in', 'originalIn'])).toBeNull()
    expect(sumCountedActivityValues([child({ compter: true, stock: -2 })], ['stock', 'originalStock'])).toBe(0)
  })
})
