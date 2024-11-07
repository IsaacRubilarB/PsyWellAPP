// reloj/reloj-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RelojComponent } from './reloj.component';

const routes: Routes = [
  { path: '', component: RelojComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RelojRoutingModule { }
