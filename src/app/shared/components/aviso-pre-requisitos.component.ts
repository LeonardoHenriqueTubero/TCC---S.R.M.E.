import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { PreRequisito } from '../../core/services/pre-requisitos.service';
import { listaEmPortugues } from '../../core/texto';

addIcons({ informationCircleOutline });

/**
 * Diz o que falta cadastrar antes, no lugar do "nada aqui ainda".
 *
 * A tela de músicos e a de lançamentos dependem de outras telas terem sido
 * preenchidas primeiro, e isso não era óbvio para quem abria o app pela
 * primeira vez. Além do texto, cada pendência vira um atalho para a aba certa.
 */
@Component({
  selector: 'app-aviso-pre-requisitos',
  imports: [RouterLink, IonButton, IonIcon],
  template: `
    <div class="srme-cartao srme-vazio aviso">
      <ion-icon name="information-circle-outline"></ion-icon>
      <h2>Falta um passo antes</h2>
      <p>Para cadastrar {{ oQue() }}, primeiro é preciso ter {{ pendencias() }}.</p>

      <div class="atalhos">
        @for (item of faltando(); track item.nome) {
          <ion-button fill="outline" size="small" [routerLink]="item.rota">
            Cadastrar {{ item.artigo }} {{ item.nome }}
          </ion-button>
        }
      </div>
    </div>
  `,
  styles: `
    .aviso {
      margin-bottom: 16px;
    }
  `,
})
export class AvisoPreRequisitosComponent {
  /** O que o usuário está tentando cadastrar: "um músico", "um lançamento". */
  readonly oQue = input.required<string>();
  readonly faltando = input.required<PreRequisito[]>();

  /** "uma casa de oração e um instrumento" — vírgulas no meio, "e" no fim. */
  protected readonly pendencias = computed(() =>
    listaEmPortugues(this.faltando().map((item) => `${item.artigo} ${item.nome}`))
  );
}
