import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiguresWidgetComponent } from './figures-widget.component';

describe('FiguresWidgetComponent', () => {
  let component: FiguresWidgetComponent;
  let fixture: ComponentFixture<FiguresWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FiguresWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FiguresWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
