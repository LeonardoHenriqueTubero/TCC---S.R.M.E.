import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { listaEmPortugues } from '../../core/texto';

addIcons({ alertCircleOutline });

/**
 * Diz, ao pé do formulário, o que ainda falta para poder salvar.
 *
 * O botão Salvar já nascia desabilitado e assim ficava até o último campo ser
 * preenchido, sem dizer qual campo era — em formulário de seis campos, como o
 * do músico, isso vira adivinhação. Aqui os que faltam aparecem pelo nome.
 *
 * A lista sai na ordem em que os rótulos são declarados, que é a ordem dos
 * campos na tela: quem lê "Cargo e Instrumento" os encontra nessa sequência
 * de cima para baixo.
 */
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
      /* Alinha o ícone com a primeira linha do texto, que é menor que ele. */
      margin-top: 1px;
      color: var(--ion-color-warning);
    }
  `,
})
export class FaltaPreencherComponent {
  readonly form = input.required<FormGroup>();

  /**
   * Nome do campo no formulário → como ele se chama na tela. Só os campos
   * listados aqui podem aparecer na mensagem, então um campo opcional
   * simplesmente não entra no mapa.
   */
  readonly rotulos = input.required<Record<string, string>>();

  /**
   * Pendências que não são campos do formulário — hoje só "pelo menos um
   * músico", no lançamento, que é uma lista de marcados à parte do FormGroup.
   */
  readonly extras = input<string[]>([]);

  protected readonly listar = listaEmPortugues;

  /**
   * Método, e não `computed()`: o estado de um FormGroup não é um sinal, então
   * um computed nunca saberia que o usuário digitou algo e a mensagem
   * congelaria. Chamado a cada verificação de mudanças, como o
   * `[disabled]="form.invalid"` que os formulários já usam ao lado.
   */
  protected faltando(): string[] {
    const form = this.form();

    // Só o que está em branco. Um campo preenchido de forma inválida — a data
    // fora do intervalo, por exemplo — tem a mensagem dele junto ao próprio
    // campo, e repeti-lo aqui como "faltando" seria mentira: ele está lá.
    // (O `min` é o que segura os selects de casa/instrumento, que começam em 0.)
    const emBranco = Object.entries(this.rotulos())
      .filter(([campo]) => {
        const controle = form.get(campo);
        return !!controle && (controle.hasError('required') || controle.hasError('min'));
      })
      .map(([, rotulo]) => rotulo);

    return [...emBranco, ...this.extras()];
  }
}
