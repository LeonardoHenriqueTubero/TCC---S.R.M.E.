import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { listaEmPortugues } from '../../core/texto';

addIcons({ alertCircleOutline });

@Component({
  selector: 'app-falta-preencher',
  imports: [IonIcon],
  template: `
    @let pendentes = faltando();
    @if (pendentes.length > 0) {
      <div class="falta">
        <ion-icon name="alert-circle-outline" aria-hidden="true"></ion-icon>
        <span>
          Ainda falta{{ pendentes.length > 1 ? 'm' : '' }}: {{ listar(pendentes) }}.
        </span>
      </div>
    }
  `,
  styles: `
    .falta {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 1rem;
      padding: 10px 12px;
      border: 1px solid var(--srme-borda-cor);
      border-radius: var(--srme-raio-pequeno);
      background: var(--ion-item-background);
      color: var(--srme-texto-suave);
      font-size: 0.875rem;
      line-height: 1.35;
    }

    ion-icon {
      flex: 0 0 auto;
      font-size: 18px;
      margin-top: 1px;
      color: var(--ion-color-warning);
    }
  `,
})
export class FaltaPreencherComponent {
  readonly form = input.required<FormGroup>();

  readonly rotulos = input.required<Record<string, string>>();

  readonly extras = input<string[]>([]);

  protected readonly listar = listaEmPortugues;

  protected faltando(): string[] {
    const form = this.form();

    const emBranco = Object.entries(this.rotulos())
      .filter(([campo]) => {
        const controle = form.get(campo);
        return !!controle && (controle.hasError('required') || controle.hasError('min'));
      })
      .map(([, rotulo]) => rotulo);

    return [...emBranco, ...this.extras()];
  }
}
