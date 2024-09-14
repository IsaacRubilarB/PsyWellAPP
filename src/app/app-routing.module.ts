import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',  // Redireccionar a la página de login por defecto
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'registrar-emociones',
    loadChildren: () => import('./registrar-emociones/registrar-emociones.module').then(m => m.RegistrarEmocionesPageModule)
  },
  {
    path: 'ver-registros',
    loadChildren: () => import('./ver-registros/ver-registros.module').then(m => m.VerRegistrosPageModule)
  }
];



@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
