import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideNativeDateAdapter } from '@angular/material/core'
import { ActivitiesService } from '../../../services/activities/activities.service'
import { AppService } from '../../../services/app/app.service'
import { ExcelService } from '../../../services/excel/excel.service'
import { ServerService } from '../../../services/http-server/server.service'
import { HumanResourceService } from '../../../services/human-resource/human-resource.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { UserService } from '../../../services/user/user.service'
import { ExtractorActivityComponent } from './extractor-activity.component'

describe('ExtractorActivityComponent date bounds', () => {
  let fixture: ComponentFixture<ExtractorActivityComponent>
  let component: ExtractorActivityComponent
  let backupId: ReturnType<typeof signal<number | null>>
  let activityService: jasmine.SpyObj<ActivitiesService>
  let userService: jasmine.SpyObj<UserService>

  beforeEach(async () => {
    backupId = signal<number | null>(null)
    activityService = jasmine.createSpyObj('ActivitiesService', ['getLastMonthActivities'])
    activityService.getLastMonthActivities.and.resolveTo(null)
    userService = jasmine.createSpyObj('UserService', ['isCa'])
    userService.isCa.and.returnValue(false)

    await TestBed.configureTestingModule({
      imports: [ExtractorActivityComponent],
      providers: [
        provideNativeDateAdapter(),
        { provide: HumanResourceService, useValue: { backupIdS: backupId } },
        { provide: ActivitiesService, useValue: activityService },
        { provide: UserService, useValue: userService },
        { provide: ExcelService, useValue: { dateStart: { next: () => {} }, dateStop: { next: () => {} } } },
        { provide: ServerService, useValue: {} },
        { provide: AppService, useValue: {} },
        { provide: ReferentielService, useValue: {} },
      ],
    }).compileComponents()
  })

  async function createComponent() {
    fixture = TestBed.createComponent(ExtractorActivityComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    await fixture.whenStable()
  }

  function enterMonth(index: number, text: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelectorAll('input.manual-input')[index]
    input.dispatchEvent(new Event('focus'))
    fixture.detectChanges()
    input.value = text
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    input.dispatchEvent(new Event('blur'))
    fixture.detectChanges()
  }

  it('waits for the jurisdiction and refreshes its latest month when it changes', async () => {
    activityService.getLastMonthActivities.and.resolveTo('2024-06-15T12:00:00Z')
    await createComponent()
    expect(activityService.getLastMonthActivities).not.toHaveBeenCalled()

    backupId.set(1)
    fixture.detectChanges()
    await fixture.whenStable()
    expect(activityService.getLastMonthActivities).toHaveBeenCalledWith(1)
    expect(component.lastDataDate).toEqual(new Date(2024, 5, 1))

    activityService.getLastMonthActivities.and.resolveTo('2025-08-15T12:00:00Z')
    backupId.set(2)
    fixture.detectChanges()
    await fixture.whenStable()
    expect(activityService.getLastMonthActivities).toHaveBeenCalledWith(2)
    expect(component.lastDataDate).toEqual(new Date(2025, 7, 1))
  })

  for (const result of [null, 'invalid date']) {
    it(`does not create a restrictive maximum from ${result}`, async () => {
      activityService.getLastMonthActivities.and.resolveTo(result)
      backupId.set(1)
      await createComponent()

      expect(component.lastDataDate).toBeNull()
      enterMonth(0, '052024')
      enterMonth(1, '062024')
      expect(component.dateStart).toEqual(new Date(2024, 4, 1))
      expect(component.dateStop).toEqual(new Date(2024, 5, 1))
      expect(component.classSelected).toBe('')
    })
  }

  it('ignores a latest-month response from the previous jurisdiction', async () => {
    let resolvePrevious!: (value: string) => void
    activityService.getLastMonthActivities.and.returnValue(new Promise((resolve) => (resolvePrevious = resolve)))
    backupId.set(1)
    await createComponent()

    activityService.getLastMonthActivities.and.resolveTo('2025-08-15T12:00:00Z')
    backupId.set(2)
    fixture.detectChanges()
    await fixture.whenStable()
    resolvePrevious('2024-06-15T12:00:00Z')
    await fixture.whenStable()

    expect(component.lastDataDate).toEqual(new Date(2025, 7, 1))
  })

  for (const isCa of [false, true]) {
    it(`applies the ${isCa ? 'CA' : 'TJ'} minimum even when the end month is entered first`, async () => {
      userService.isCa.and.returnValue(isCa)
      await createComponent()
      const firstYear = isCa ? 2022 : 2021

      enterMonth(1, `12${firstYear - 1}`)
      expect(component.dateStop).toBeNull()
      enterMonth(1, `01${firstYear}`)
      expect(component.dateStop).toEqual(new Date(firstYear, 0, 1))
    })
  }

  it('accepts a typed range and rejects months outside its bounds', async () => {
    activityService.getLastMonthActivities.and.resolveTo('2024-06-15T12:00:00Z')
    backupId.set(1)
    await createComponent()

    enterMonth(0, '052024')
    enterMonth(1, '062024')
    expect(component.classSelected).toBe('')
    expect(component.dateStart).toEqual(new Date(2024, 4, 1))
    expect(component.dateStop).toEqual(new Date(2024, 5, 1))

    enterMonth(1, '042024')
    expect(component.dateStop).toEqual(new Date(2024, 5, 1))
    enterMonth(1, '072024')
    expect(component.dateStop).toEqual(new Date(2024, 5, 1))
    enterMonth(0, '072024')
    expect(component.dateStart).toEqual(new Date(2024, 4, 1))
  })
})
