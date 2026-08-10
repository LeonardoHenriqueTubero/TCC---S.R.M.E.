import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/** As duas caras do app: a de programa de computador e a de aplicativo. */
export type Formato = 'desktop' | 'celular';

const CLASSES: Record<Formato, string> = {
  desktop: 'srme-desktop',
  celular: 'srme-celular',
};

/**
 * Decide, uma vez só, se o app se desenha como programa de computador ou como
 * aplicativo de celular.
 *
 * Antes quem decidia era a largura da janela (`@media (min-width: 992px)`), e o
 * efeito colateral aparecia no desktop: encolher a janela transformava o
 * programa num aplicativo de celular — barra lateral virava abas embaixo, botão
 * da barra de título virava botão flutuante. Agora quem decide é a plataforma,
 * então o formato não muda mais enquanto o app estiver aberto.
 *
 * A escolha vira uma classe no <html> (`srme-desktop` ou `srme-celular`), que é
 * o que os estilos consultam — ver global.scss.
 */
@Injectable({
  providedIn: 'root',
})
export class FormatoService {
  /** Chamado uma vez na abertura do app, antes das telas aparecerem. */
  iniciar(): void {
    document.documentElement.classList.add(CLASSES[this.detectar()]);
  }

  private detectar(): Formato {
    switch (Capacitor.getPlatform()) {
      case 'android':
      case 'ios':
        return 'celular';
      case 'electron':
        return 'desktop';
      default:
        // No navegador não há plataforma declarada, então quem responde é o
        // apontador: mouse tem precisão fina, dedo não tem. Vale dizer que a
        // emulação de celular do DevTools também responde `coarse`, então
        // continua dando para conferir o formato de celular pelo navegador.
        return window.matchMedia('(pointer: fine)').matches ? 'desktop' : 'celular';
    }
  }
}
