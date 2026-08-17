import { Component, input, output } from '@angular/core';
import { IonSearchbar } from '@ionic/angular/standalone';

/**
 * A barra de busca das listagens, com a contagem do que sobrou.
 *
 * Existe para as cinco telas buscarem do mesmo jeito: mesmo atraso de digitação,
 * mesmo botão de limpar, mesma frase de resultado. Cada tela só diz o que
 * procurar e devolve quantos encontrou; o filtro em si fica com ela, porque
 * cada uma casa campos diferentes (ver contemTermo em core/texto.ts).
 */
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

    <!-- A contagem só aparece com busca em andamento: sem ela, repetir o total
         embaixo de uma lista que já está inteira na tela não diz nada. -->
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

  /** Como se chama um item da lista: "músico", "casa de oração". */
  readonly substantivo = input.required<string>();
  /** O plural, escrito à mão porque "casa de oração" não vira plural com um s. */
  readonly plural = input.required<string>();

  readonly total = input.required<number>();
  readonly encontrados = input.required<number>();

  readonly termoMudou = output<string>();
}
