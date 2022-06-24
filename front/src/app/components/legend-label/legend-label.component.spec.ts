import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegendLabelComponent } from './legend-label.component';

describe('LegendLabelComponent', () => {
  let component: LegendLabelComponent;
  let fixture: ComponentFixture<LegendLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LegendLabelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LegendLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
