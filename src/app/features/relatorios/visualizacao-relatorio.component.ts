import { Component, ElementRef, OnDestroy, inject, input, output } from '@angular/core';
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, printOutline } from 'ionicons/icons';
import { Relatorio } from '../../shared/services/pdf.service';

addIcons({ downloadOutline, printOutline });

/** Id do bloco que só existe durante a impressão (ver global.scss). */
const AREA_IMPRESSAO = 'area-impressao';

/**
 * Mostra o relatório na tela antes de virar arquivo, com os botões de imprimir
 * e baixar.
 *
 * Por que o relatório é redesenhado aqui em HTML, em vez de exibir o próprio
 * PDF: nem o Electron nem o WebView do Android trazem visualizador de PDF.
 * Medido — com a CSP liberada para `blob:` e com `webPreferences.plugins`
 * ligado, um <iframe> apontando para o PDF continua em branco, sem erro nenhum
 * no console. A alternativa seria embutir o pdf.js (~1 MB) e desenhar as
 * páginas em canvas, o que ainda por cima faria a impressão sair rasterizada.
 *
 * Redesenhar em HTML custa este arquivo e devolve uma impressão em texto de
 * verdade, que é metade do que se queria. Os dois desenhos não divergem à toa:
 * ambos leem o mesmo `Relatorio` — as mesmas seções, colunas e linhas que o
 * PdfService recebe —, então o que muda de um para o outro é só o acabamento.
 */
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

    <!-- Rolagem própria, e não um ion-content: o conteúdo do ion-content rola
         dentro de um div do shadow DOM dele, e é esse div que a impressão
         recortaria na altura da tela. -->
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
      /* O cinza em volta é o que faz a folha branca parecer uma folha. Fixo de
         propósito: não acompanha o tema escuro, porque o que está ali dentro é
         papel, e papel é branco nos dois temas. */
      background: #6b7684;
    }

    /* Daqui para baixo as cores são escritas à mão, e não tiradas das variáveis
       do tema, pelo mesmo motivo: esta parte representa o papel impresso e
       precisa ser igual ao PDF (as cores são as do pdf.service.ts). */
    .folha {
      max-width: 794px; /* A4 a 96 dpi */
      margin: 0 auto;
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
      /* A quebra de página não deve cair entre o título de uma seção e a
         tabela dele. */
      break-inside: avoid;
    }

    section h2 {
      margin: 0 0 8px;
      padding-left: 10px;
      font-size: 15px;
      font-weight: 700;
      /* O mesmo tico dourado que o PDF desenha à esquerda de cada seção. */
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
      /* Numa tabela que atravessa páginas, o cabeçalho se repete em cada uma. */
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
  /** Data já formatada, recebida pronta para bater com a que o PDF imprime. */
  readonly emitidoEm = input.required<string>();

  readonly fechar = output<void>();
  readonly baixar = output<void>();

  protected readonly MARCA = 'S.R.M.E.';

  private readonly elemento = inject(ElementRef<HTMLElement>);

  /**
   * A folha é copiada para fora do app e só então impressa.
   *
   * Imprimir a folha onde ela está não funciona: ela vive dentro de um
   * ion-modal, que é posicionado e recortado para caber na tela, e a impressão
   * herdaria esse recorte — sairia a primeira página e mais nada. Fora do
   * ion-app a cópia não tem nenhum desses ancestrais, e o navegador a pagina
   * inteira. As regras que escondem o app e mostram a cópia estão no
   * global.scss; os estilos da folha continuam valendo porque o Angular os
   * aplica por atributo, que a cópia carrega junto.
   */
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

    // A cópia sai de cena assim que a impressão termina (ou é cancelada). Se
    // este evento não chegar, ela fica invisível na tela de qualquer jeito, e a
    // próxima impressão — ou o fechar desta tela — a substitui.
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
