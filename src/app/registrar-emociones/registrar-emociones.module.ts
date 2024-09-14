import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistrarEmocionesPageRoutingModule } from './registrar-emociones-routing.module';

import { RegistrarEmocionesPage } from './registrar-emociones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistrarEmocionesPageRoutingModule
  ],
  declarations: [RegistrarEmocionesPage]
})
export class RegistrarEmocionesPageModule {}
