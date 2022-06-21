import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputPercentComponent } from './input-percent.component';

describe('InputPercentComponent', () => {
  let component: InputPercentComponent;
  let fixture: ComponentFixture<InputPercentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputPercentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputPercentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
