import { Component, ElementRef, OnDestroy, inject, input, output } from '@angular/core';
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, printOutline } from 'ionicons/icons';
import { Relatorio } from '../../shared/services/pdf.service';

addIcons({ downloadOutline, printOutline });

const AREA_IMPRESSAO = 'area-impressao';

@Component({
  selector: 'app-visualizacao-relatorio',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="fechar.emit()">Fechar</ion-button>
        </ion-buttons>
        <ion-title>Pré-visualização</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="imprimir()">
            <ion-icon slot="start" name="print-outline"></ion-icon>
            Imprimir
          </ion-button>
          <ion-button [strong]="true" (click)="baixar.emit()">
            <ion-icon slot="start" name="download-outline"></ion-icon>
            Baixar PDF
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <div class="rolagem">
      <article class="folha">
        <header class="tarja">
          <div class="linha-marca">
            <span class="marca">{{ MARCA }}</span>
            <span>Emitido em {{ emitidoEm() }}</span>
          </div>
          <h1>{{ relatorio().titulo }}</h1>
        </header>

        @if (relatorio().subtitulo) {
          <p class="subtitulo">{{ relatorio().subtitulo }}</p>
        }

        @for (secao of relatorio().secoes; track $index) {
          <section>
            @if (secao.titulo) {
              <h2>{{ secao.titulo }}</h2>
            }
            <table>
              <thead>
                <tr>
                  @for (coluna of secao.colunas; track $index) {
                    <th>{{ coluna }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (linha of secao.linhas; track $index) {
                  <tr>
                    @for (celula of linha; track $index) {
                      <td>{{ celula }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }

        <footer class="rodape">{{ MARCA }}</footer>
      </article>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .rolagem {
      flex: 1;
      overflow-y: auto;
      padding: 24px 16px;
      background: #6b7684;
    }

    .folha {
      max-width: 794px;      margin: 0 auto;
      background: #fff;
      color: #1c2530;
      box-shadow: 0 2px 12px rgb(0 0 0 / 25%);
      font-size: 13px;
      line-height: 1.4;
    }

    .tarja {
      background: #1e5a8e;
      border-bottom: 3px solid #c88a2e;
      color: #fff;
      padding: 14px 28px 18px;
    }

    .linha-marca {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      color: #bacdde;
      font-size: 11px;
    }

    .marca {
      font-weight: 700;
      letter-spacing: 0.14em;
    }

    .tarja h1 {
      margin: 10px 0 0;
      font-size: 23px;
      font-weight: 700;
    }

    .subtitulo {
      margin: 0;
      padding: 16px 28px 0;
      color: #6b7684;
    }

    section {
      padding: 18px 28px 0;
      break-inside: avoid;
    }

    section h2 {
      margin: 0 0 8px;
      padding-left: 10px;
      font-size: 15px;
      font-weight: 700;
      border-left: 3px solid #c88a2e;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th {
      background: #1e5a8e;
      color: #fff;
      font-weight: 700;
      text-align: left;
    }

    th,
    td {
      padding: 5px 7px;
    }

    td {
      border-bottom: 1px solid #d6dfe8;
    }

    tbody tr:nth-child(even) td {
      background: #f0f4f9;
    }

    thead {
      display: table-header-group;
    }

    tr {
      break-inside: avoid;
    }

    .rodape {
      margin-top: 24px;
      padding: 10px 28px 18px;
      border-top: 1px solid #d6dfe8;
      color: #1e5a8e;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
    }
  `,
})
export class VisualizacaoRelatorioComponent implements OnDestroy {
  readonly relatorio = input.required<Relatorio>();
  readonly emitidoEm = input.required<string>();

  readonly fechar = output<void>();
  readonly baixar = output<void>();

  protected readonly MARCA = 'S.R.M.E.';

  private readonly elemento = inject(ElementRef<HTMLElement>);

  imprimir(): void {
    const folha = this.elemento.nativeElement.querySelector('.folha') as HTMLElement | null;
    if (!folha) {
      return;
    }

    this.limparAreaDeImpressao();

    const area = document.createElement('div');
    area.id = AREA_IMPRESSAO;
    area.appendChild(folha.cloneNode(true));
    document.body.appendChild(area);

    const aoTerminar = () => {
      window.removeEventListener('afterprint', aoTerminar);
      this.limparAreaDeImpressao();
    };
    window.addEventListener('afterprint', aoTerminar);

    window.print();
  }

  ngOnDestroy(): void {
    this.limparAreaDeImpressao();
  }

  private limparAreaDeImpressao(): void {
    document.getElementById(AREA_IMPRESSAO)?.remove();
  }
}
