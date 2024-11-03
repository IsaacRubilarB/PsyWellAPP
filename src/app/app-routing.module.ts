import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; 

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', 
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
  },  
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'registrar-emociones',
    loadChildren: () => import('./registrar-emociones/registrar-emociones.module').then(m => m.RegistrarEmocionesPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'tips',
    loadChildren: () => import('./tips/tips.module').then(m => m.TipsPageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'ajustes',
    loadChildren: () => import('./ajustes/ajustes.module').then(m => m.AjustesPageModule), 
    canActivate: [AuthGuard] 
  },
  {
    path: '**', 
    redirectTo: 'login', 
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }) 
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
