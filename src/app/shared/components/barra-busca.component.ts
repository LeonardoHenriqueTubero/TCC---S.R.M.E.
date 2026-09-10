import { Component, input, output } from '@angular/core';
import { IonSearchbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-barra-busca',
  imports: [IonSearchbar],
  template: `
    <ion-searchbar
      [placeholder]="placeholder()"
      [value]="termo()"
      [debounce]="150"
      (ionInput)="termoMudou.emit($any($event.target).value ?? '')"
      (ionClear)="termoMudou.emit('')"
    ></ion-searchbar>

    @if (termo().trim()) {
      <p class="contagem">
        @if (encontrados() === 0) {
          Nenhum resultado para "{{ termo().trim() }}".
        } @else {
          {{ encontrados() }} de {{ total() }} {{ total() === 1 ? substantivo() : plural() }}.
        }
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .contagem {
      margin: 0 0 10px;
      padding-inline: 16px;
      font-size: 0.8125rem;
      color: var(--srme-texto-suave);
    }
  `,
})
export class BarraBuscaComponent {
  readonly placeholder = input.required<string>();
  readonly termo = input.required<string>();

  readonly substantivo = input.required<string>();
  readonly plural = input.required<string>();

  readonly total = input.required<number>();
  readonly encontrados = input.required<number>();

  readonly termoMudou = output<string>();
}
