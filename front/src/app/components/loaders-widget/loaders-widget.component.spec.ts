import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadersWidgetComponent } from './loaders-widget.component';

describe('LoadersWidgetComponent', () => {
  let component: LoadersWidgetComponent;
  let fixture: ComponentFixture<LoadersWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadersWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadersWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
