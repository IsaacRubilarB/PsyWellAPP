// reloj/reloj.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelojComponent } from './reloj.component';
import { RelojRoutingModule } from './reloj-routing.module';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [RelojComponent],
  imports: [
    CommonModule,
    RelojRoutingModule,
    IonicModule,
    RelojRoutingModule
  ],
})
export class RelojModule { }
