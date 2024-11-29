import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { ModalImageComponent } from './modal-image/modal-image.component';  // Importar el componente
import { GoogleMapsComponent } from './google-maps/google-maps.component';

import { SafePipe } from './pipes/safe.pipe';

import { PsicologoModalComponent } from './psicologo-modal/psicologo-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    PsicologoModalComponent,
    SafePipe ,
    ModalImageComponent// Declara el SafePipe aquí
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),  // Configuración de Firebase
    AngularFireAuthModule,
    RouterModule.forRoot([]),
    GoogleMapsComponent
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withInterceptorsFromDi()),
    AuthService,
    AuthGuard,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
