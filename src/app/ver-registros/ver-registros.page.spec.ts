import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerRegistrosPage } from './ver-registros.page';

describe('VerRegistrosPage', () => {
  let component: VerRegistrosPage;
  let fixture: ComponentFixture<VerRegistrosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerRegistrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
