import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Escolhe como cada ion-select se abre conforme o tamanho da tela.
 *
 * No celular a lista sobe do rodapé (ou vira um diálogo, quando aceita mais de
 * uma escolha — a folha de ações do Ionic não faz seleção múltipla). Na tela
 * grande ela vira uma lista suspensa presa ao campo, como em qualquer programa
 * de computador: uma folha subindo do rodapé de uma janela de 1280px atravessa
 * a tela inteira para escolher uma casa de oração.
 *
 * A regra fica aqui, e não repetida no atributo `interface` de cada select,
 * porque são dez espalhados por quatro telas — e porque ela precisa acompanhar
 * o redimensionamento da janela, o que um atributo fixo não faz.
 *
 * De carona, o botão de fechar dessas listas: o padrão do Ionic é "Cancel",
 * em inglês, e este é o único ponto por onde todos os selects do app passam.
 */

/** Mesma largura em que o app deixa de imitar o celular (ver global.scss). */
const TELA_GRANDE = '(min-width: 992px)';

@Directive({
  selector: 'ion-select',
})
export class SelecaoAdaptavelDirective implements OnInit, OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLIonSelectElement>>(ElementRef);
  private readonly telaGrande = window.matchMedia(TELA_GRANDE);
  private readonly aoMudarALargura = () => this.aplicar();

  ngOnInit(): void {
    this.elemento.nativeElement.cancelText = 'Cancelar';
    this.aplicar();
    this.telaGrande.addEventListener('change', this.aoMudarALargura);
  }

  ngOnDestroy(): void {
    this.telaGrande.removeEventListener('change', this.aoMudarALargura);
  }

  private aplicar(): void {
    const select = this.elemento.nativeElement;
    select.interface = this.telaGrande.matches
      ? 'popover'
      : select.multiple
        ? 'alert'
        : 'action-sheet';
  }
}
