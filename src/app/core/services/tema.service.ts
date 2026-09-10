import { Injectable, signal } from '@angular/core';

const CHAVE = 'srme.tema';

@Injectable({
  providedIn: 'root',
})
export class TemaService {
  private readonly _escuro = signal(false);
  readonly escuro = this._escuro.asReadonly();

  iniciar(): void {
    this.aplicar(localStorage.getItem(CHAVE) === 'escuro');
  }

  alternar(): void {
    const escuro = !this._escuro();
    this.aplicar(escuro);
    localStorage.setItem(CHAVE, escuro ? 'escuro' : 'claro');
  }

  private aplicar(escuro: boolean): void {
    this._escuro.set(escuro);

    document.documentElement.classList.toggle('ion-palette-dark', escuro);

    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', escuro ? 'dark' : 'light');
  }
}
