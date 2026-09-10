import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

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
