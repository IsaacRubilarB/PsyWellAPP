import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',  // Redirecciona a la página de login por defecto
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
    path: 'tips',
    loadChildren: () => import('./tips/tips.module').then(m => m.TipsPageModule)
  },
  {
    path: 'ajustes',
    loadChildren: () => import('./ajustes/ajustes.module').then(m => m.AjustesPageModule) // Ruta para la página de ajustes
  },
  {
    path: '**', 
    redirectTo: 'login', // Redirecciona a login si la ruta no se encuentra
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }) // Preload all modules for faster navigation
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
