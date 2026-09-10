import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { PreRequisito } from '../../core/services/pre-requisitos.service';
import { listaEmPortugues } from '../../core/texto';

addIcons({ informationCircleOutline });

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
  readonly oQue = input.required<string>();
  readonly faltando = input.required<PreRequisito[]>();

  protected readonly pendencias = computed(() =>
    listaEmPortugues(this.faltando().map((item) => `${item.artigo} ${item.nome}`))
  );
}
