import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private afs: AngularFirestore
  ) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      take(1),
      switchMap((user) => {
        if (!user) {
          // Si no hay usuario autenticado, redirigir al login
          this.router.navigate(['/login']);
          return [false];
        }

        // Verificar en Firestore si el perfil del usuario está completo
        return this.afs
          .collection('users')
          .doc(user.uid)
          .valueChanges()
          .pipe(
            take(1),
            map((userData: any) => {
              if (userData && userData.nombre && userData.email) {
                // Perfil completo
                return true;
              } else {
                // Perfil incompleto, redirigir al formulario de completar perfil
                this.router.navigate(['/completeprofile'], {
                  state: { email: user.email, name: user.displayName || '' },
                });
                return false;
              }
            })
          );
      })
    );
  }
}
