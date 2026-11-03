import '@angular/compiler'
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel'
import { PopinEditActivitiesComponent } from './popin-edit-activities.component'

describe('Total JAP pendant une saisie', () => {
  let component: PopinEditActivitiesComponent
  let child: ContentieuReferentielInterface

  beforeEach(() => {
    component = Object.create(PopinEditActivitiesComponent.prototype)
    child = {
      id: 93, label: 'Détail extracteur', averageProcessingTime: null,
      compter: false, in: null, originalIn: 100, out: null, originalOut: 80, stock: null, originalStock: 200,
    }
    component.referentiel = {
      id: 9, label: 'JAP', averageProcessingTime: null, childrens: [child],
      in: null, originalIn: 10, out: null, originalOut: 8, stock: null, originalStock: 20,
    }
    component.total = {
      in: { value: null, updated: false }, out: { value: null, updated: false }, stock: { value: null, updated: false },
    }
    component.updates = {}
  })

  it('laisse le total inchangé lorsque la saisie concerne un enfant décoché', () => {
    component.updates = {
      '93-entrees': { contentieux: child, node: 'entrees', value: 150 },
      '93-sorties': { contentieux: child, node: 'sorties', value: 120 },
      '93-stock': { contentieux: child, node: 'stock', value: 300 },
    }
    component.updateTotal()
    expect(component.total).toEqual({
      in: { value: null, updated: false }, out: { value: null, updated: false }, stock: { value: null, updated: false },
    })
    expect(component.CheckIfChildrenAreUpdated(component.referentiel!, 'entrees')).toBe(false)
    expect(component.updates['93-entrees'].value).toBe(150)
  })

  it('ajuste le total d’un enfant coché sans perdre la contribution des lignes masquées', () => {
    child.compter = true
    child.originalIn = 4
    component.updates = { '93-entrees': { contentieux: child, node: 'entrees', value: 0 } }
    component.updateTotal()
    expect(component.total.in.value).toBe(6)
    expect(component.total.in.updated).toBe(true)

    component.updates = {}
    component.updateTotal()
    expect(component.total.in.updated).toBe(false)
  })
})
