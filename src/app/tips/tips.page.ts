import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RecursosService } from '../services/recursos.service';

interface Audio {
  titulo: string;
  url: string;
}

interface Video {
  titulo: string;
  url: string;
}

interface Libro {
  titulo: string;
  url: string;
  autor: string;
  portada?: string;
}

@Component({
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
})
export class TipsPage implements OnInit {
  currentSegment: string = 'tips';
  audio: HTMLAudioElement | undefined;
  activeSound: string | null = null;
  audioProgress = 0;
  showVideo: string = '';
  videoUrl: SafeResourceUrl | null = null;

  sonidos: Audio[] = [];
  videos: Video[] = [];
  libros: Libro[] = [];

  constructor(
    private router: Router,
    private recursosService: RecursosService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarSonidos();
    this.cargarVideos();
    this.cargarLibros();
  }

  cargarSonidos() {
    this.recursosService.obtenerSonidos().subscribe((data: Audio[]) => {
      this.sonidos = data;
    });
  }

  cargarVideos() {
    this.recursosService.obtenerVideos().subscribe((data: Video[]) => {
      this.videos = data;
    });
  }

  cargarLibros() {
    this.recursosService.obtenerLibros().subscribe((data: Libro[]) => {
      this.libros = data.map((libro) => {
        libro.portada = libro.portada || 'assets/default-portada.png';
        return libro;
      });
    });
  }

  toggleAudio(sound: Audio) {
    if (this.activeSound === sound.url) {
      this.audio?.pause();
      this.audio = undefined;
      this.activeSound = null;
      this.audioProgress = 0;
    } else {
      if (this.audio) {
        this.audio.pause();
      }
      this.audio = new Audio(sound.url);
      this.audio.play();
      this.activeSound = sound.url;
      this.trackAudioProgress();
    }
  }

  trackAudioProgress() {
    if (this.audio) {
      this.audio.ontimeupdate = () => {
        if (this.audio && this.audio.duration) {
          this.audioProgress = (this.audio.currentTime / this.audio.duration) * 100;
        }
      };

      this.audio.onended = () => {
        this.audioProgress = 0;
        this.activeSound = null;
      };
    }
  }

  toggleVideo(videoTitulo: string) {
    if (this.showVideo === videoTitulo) {
      this.showVideo = '';
      this.videoUrl = null;
    } else {
      const video = this.videos.find((v) => v.titulo === videoTitulo);
      if (video) {
        this.showVideo = videoTitulo;
        this.videoUrl = this.sanitizeUrl(video.url);
      }
    }
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openBook(url: string) {
    window.open(url, '_blank');
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.currentSegment = path.substring(1);
  }

  isPlaying(sound: Audio): boolean {
    return !!(this.activeSound === sound.url && this.audio && !this.audio.paused);
  }
}
