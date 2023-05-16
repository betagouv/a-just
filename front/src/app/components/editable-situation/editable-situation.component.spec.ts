import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableSituationComponent } from './editable-situation.component';

describe('EditableSituationComponent', () => {
  let component: EditableSituationComponent;
  let fixture: ComponentFixture<EditableSituationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditableSituationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditableSituationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
