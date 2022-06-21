import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoveragePreviewComponent } from './coverage-preview.component';

describe('CoveragePreviewComponent', () => {
  let component: CoveragePreviewComponent;
  let fixture: ComponentFixture<CoveragePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoveragePreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoveragePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
