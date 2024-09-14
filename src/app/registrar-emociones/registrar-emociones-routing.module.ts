import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistrarEmocionesPage } from './registrar-emociones.page';

const routes: Routes = [
  {
    path: '',
    component: RegistrarEmocionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistrarEmocionesPageRoutingModule {}
