import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export type Formato = 'desktop' | 'celular';

const CLASSES: Record<Formato, string> = {
  desktop: 'srme-desktop',
  celular: 'srme-celular',
};

@Injectable({
  providedIn: 'root',
})
export class FormatoService {
  readonly formato: Formato = this.detectar();

  get ehDesktop(): boolean {
    return this.formato === 'desktop';
  }

  iniciar(): void {
    document.documentElement.classList.add(CLASSES[this.formato]);
  }

  private detectar(): Formato {
    switch (Capacitor.getPlatform()) {
      case 'android':
      case 'ios':
        return 'celular';
      case 'electron':
        return 'desktop';
      default:
        return window.matchMedia('(pointer: fine)').matches ? 'desktop' : 'celular';
    }
  }
}
