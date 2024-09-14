import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerRegistrosPageRoutingModule } from './ver-registros-routing.module';

import { VerRegistrosPage } from './ver-registros.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerRegistrosPageRoutingModule
  ],
  declarations: [VerRegistrosPage]
})
export class VerRegistrosPageModule {}
