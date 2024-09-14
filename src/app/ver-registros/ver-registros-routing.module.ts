import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VerRegistrosPage } from './ver-registros.page';

const routes: Routes = [
  {
    path: '',
    component: VerRegistrosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VerRegistrosPageRoutingModule {}
