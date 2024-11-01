import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth'; // Usa compat
import { LoginPageRoutingModule } from './login-routing.module';
import { LoginRegisterComponent } from './login.page';
import { AuthGuard } from '../guards/auth.guard';

@NgModule({
  declarations: [LoginRegisterComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    LoginPageRoutingModule
  ],
  providers: [AuthGuard], // Asegúrate de incluir tu guardia aquí

})
export class LoginModule {}
