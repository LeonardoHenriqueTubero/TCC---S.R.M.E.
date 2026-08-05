import { Injectable, signal } from '@angular/core';

/** Chave no armazenamento do navegador. O prefixo evita esbarrar em outra
 *  coisa guardada pela mesma origem. */
const CHAVE = 'srme.tema';

/**
 * Alterna entre o tema claro e o escuro.
 *
 * A escolha é sempre do usuário, nunca do sistema: o app não importa a paleta
 * automática do Ionic (`dark.system.css`) e sim a por classe, então o tema só
 * muda quando alguém aperta o botão. Assim quem usa o computador no escuro não
 * é obrigado a usar o app no escuro — e vice-versa.
 *
 * A preferência fica no armazenamento local, que existe igual no navegador, no
 * Electron e na WebView do Android; não precisa de plugin nem de banco.
 */
@Injectable({
  providedIn: 'root',
})
export class TemaService {
  /** Sinal para as telas mostrarem o ícone certo no botão. */
  private readonly _escuro = signal(false);
  readonly escuro = this._escuro.asReadonly();

  /** Chamado uma vez na abertura do app, antes das telas aparecerem. */
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

    // A classe é o que liga a paleta escura do Ionic (ver o global.scss).
    document.documentElement.classList.toggle('ion-palette-dark', escuro);

    // Sem acertar isto junto, os controles desenhados pelo próprio sistema —
    // o seletor de data, as barras de rolagem — continuariam claros dentro de
    // um app escuro.
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', escuro ? 'dark' : 'light');
  }
}
