import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TipsPageRoutingModule } from './tips-routing.module';
import { TipsPage } from './tips.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TipsPageRoutingModule
  ],
  declarations: [
    TipsPage,
     
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TipsPageModule {}
