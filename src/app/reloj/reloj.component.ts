import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ListaCitasResponse } from '../home/cita.model';
import { CitasService } from '../services/citasService'; // Asegúrate de la ruta correcta


@Component({
  selector: 'app-reloj',
  templateUrl: './reloj.component.html',
  styleUrls: ['./reloj.component.scss']
})
export class RelojComponent {
currentSegment: any;
citas: ListaCitasResponse['data'] | undefined; 

  constructor(private router: Router,private citasService: CitasService) {}
 
  ngOnInit() {
  }



  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}

