import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrarEmocionesPage } from './registrar-emociones.page';

describe('RegistrarEmocionesPage', () => {
  let component: RegistrarEmocionesPage;
  let fixture: ComponentFixture<RegistrarEmocionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrarEmocionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
