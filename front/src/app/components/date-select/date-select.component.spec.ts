import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideNativeDateAdapter } from '@angular/material/core'
import { DateSelectComponent } from './date-select.component'

describe('DateSelectComponent manual input', () => {
  let fixture: ComponentFixture<DateSelectComponent>
  let component: DateSelectComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateSelectComponent],
      providers: [provideNativeDateAdapter()],
    }).compileComponents()

    fixture = TestBed.createComponent(DateSelectComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('manualInput', true)
    fixture.componentRef.setInput('dateType', 'month')
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('accepts the boundary months regardless of the day and time on min/max', () => {
    component.min = new Date(2024, 4, 15, 12)
    component.max = new Date(2024, 5, 20, 18)

    expect(component.parseEditValue('05/2024')).toEqual(new Date(2024, 4, 1))
    expect(component.parseEditValue('06/2024')).toEqual(new Date(2024, 5, 1))
    expect(component.parseEditValue('04/2024')).toBeNull()
    expect(component.parseEditValue('07/2024')).toBeNull()
    expect(component.parseEditValue('13/2024')).toBeNull()
  })

  it('keeps day precision and ignores time for daily input', () => {
    component.dateType = 'date'
    component.min = new Date(2024, 4, 15, 12)
    component.max = new Date(2024, 4, 15, 18)

    expect(component.parseEditValue('15/05/2024')).toEqual(new Date(2024, 4, 15))
    expect(component.parseEditValue('14/05/2024')).toBeNull()
    expect(component.parseEditValue('16/05/2024')).toBeNull()
    expect(component.parseEditValue('31/02/2024')).toBeNull()
  })

  it('preserves typed text when a bound arrives, then commits the month on blur', () => {
    const emitted: Date[] = []
    component.valueChange.subscribe((value: Date) => emitted.push(value))
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input.manual-input')
    input.dispatchEvent(new Event('focus'))
    fixture.detectChanges()
    input.value = '052024'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    fixture.componentRef.setInput('max', new Date(2024, 5, 20))
    fixture.detectChanges()
    expect(input.value).toBe('05/2024')

    input.dispatchEvent(new Event('blur'))
    fixture.detectChanges()
    expect(emitted).toEqual([new Date(2024, 4, 1)])
    expect(input.value).toBe('Mai 2024')
  })

  it('still validates preserved input against the newly loaded bound', () => {
    component.onEditFocus()
    component.editValue = '07/2024'
    fixture.componentRef.setInput('max', new Date(2024, 5, 20))
    fixture.detectChanges()

    component.onEditBlur()
    expect(component.value).toBeNull()
    expect(component.editValue).toBe('')
  })

  it('synchronizes an external value change even while the input is focused', () => {
    component.onEditFocus()
    component.editValue = '05/2024'
    fixture.componentRef.setInput('value', new Date(2024, 5, 1))
    fixture.detectChanges()

    expect(component.editValue).toBe('06/2024')
  })
})
