import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  currentSegment: string = 'home'; // El segmento actual es 'home'

  constructor(private router: Router) { }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1); // Actualiza el segmento activo
  }
}
