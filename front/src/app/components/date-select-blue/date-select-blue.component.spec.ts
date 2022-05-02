import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateSelectBlueComponent } from './date-select-blue.component';

describe('DateSelectBlueComponent', () => {
  let component: DateSelectBlueComponent;
  let fixture: ComponentFixture<DateSelectBlueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DateSelectBlueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateSelectBlueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
