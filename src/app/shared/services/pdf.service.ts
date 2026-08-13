import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Uma tabela do relatório. O título é opcional: use quando o relatório for
 *  dividido em grupos (por exemplo, uma tabela para cada família de instrumento). */
export interface SecaoRelatorio {
  titulo?: string;
  colunas: string[];
  linhas: (string | number)[][];
}

/** Tudo que uma tela precisa informar para virar PDF. */
export interface Relatorio {
  titulo: string;
  subtitulo?: string;
  /** Nome do arquivo, sem a extensão .pdf. */
  nomeArquivo: string;
  secoes: SecaoRelatorio[];
}

const MARCA = 'S.R.M.E.';

const MARGEM = 14;
/** Onde o conteúdo recomeça nas páginas seguintes, abaixo da tarja de topo. */
const TOPO_CONTINUACAO = 26;
/** Faixa reservada ao rodapé, para nenhuma tabela encostar nele. */
const RODAPE = 18;

const ALTURA_TARJA = 28;

const FONTE_TABELA = 9;
const PREENCHIMENTO_CELULA = 2.2;

// A paleta é a mesma do app (theme/variables.scss), para o relatório impresso
// não parecer de outro sistema: o azul das barras, o dourado dos destaques e os
// neutros do texto.
const AZUL: [number, number, number] = [30, 90, 142];
const DOURADO: [number, number, number] = [200, 138, 46];
const GRAFITE: [number, number, number] = [28, 37, 48];
const CINZA: [number, number, number] = [107, 118, 132];
const AZUL_CLARO: [number, number, number] = [186, 205, 222];
const LINHA: [number, number, number] = [214, 223, 232];
const FUNDO_ALTERNADO: [number, number, number] = [240, 244, 249];

/**
 * Converte os dados de uma tela em PDF.
 *
 * As telas montam apenas o conteúdo (título e tabelas) e chamam `gerar()`; a
 * montagem do documento, o cabeçalho, o rodapé e a entrega do arquivo ficam
 * todos aqui, para os quatro relatórios saírem com a mesma cara.
 *
 * Uso típico:
 *   await this.pdf.gerar({
 *     titulo: 'Relatório de Músicos',
 *     nomeArquivo: 'relatorio-musicos',
 *     secoes: [{ colunas: ['Nome', 'Instrumento'], linhas: [['João', 'Violino']] }],
 *   });
 */
@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private readonly plataforma = Capacitor.getPlatform();

  /**
   * Se esta plataforma mostra o relatório na tela antes de entregar o arquivo.
   *
   * Anda junto com o `entregar()` lá embaixo: onde a entrega é um download
   * (computador), a pré-visualização faz sentido e é de onde se manda imprimir;
   * onde a entrega é o compartilhar do sistema (celular), o próprio aplicativo
   * que recebe o PDF já o mostra e oferece imprimir, então uma tela nossa no
   * meio do caminho só atrasaria.
   */
  get temPreVisualizacao(): boolean {
    return this.plataforma === 'web' || this.plataforma === 'electron';
  }

  async gerar(relatorio: Relatorio): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let y = this.desenharCabecalho(doc, relatorio);

    for (const secao of relatorio.secoes) {
      y = this.desenharSecao(doc, secao, y);
    }

    this.desenharBordas(doc, relatorio);
    await this.entregar(doc, `${relatorio.nomeArquivo}.pdf`);
  }

  // A tarja de abertura: azul de ponta a ponta com a marca e o título, fechada
  // por um fio dourado. Devolve o Y onde a primeira tabela começa.
  private desenharCabecalho(doc: jsPDF, relatorio: Relatorio): number {
    const largura = doc.internal.pageSize.getWidth();

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, largura, ALTURA_TARJA, 'F');

    doc.setFillColor(...DOURADO);
    doc.rect(0, ALTURA_TARJA, largura, 1.2, 'F');

    // A marca vai espaçada, como um letreiro, para não competir com o título.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...AZUL_CLARO);
    doc.setCharSpace(1.4);
    doc.text(MARCA, MARGEM, 11);
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido em ${this.dataDeHoje()}`, largura - MARGEM, 11, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255);
    doc.text(relatorio.titulo, MARGEM, 21);

    let y = ALTURA_TARJA + 8;
    if (relatorio.subtitulo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...CINZA);
      doc.text(relatorio.subtitulo, MARGEM, y);
      y += 4;
    }

    doc.setTextColor(...GRAFITE);
    return y + 2;
  }

  // Desenha uma tabela e devolve o Y logo abaixo dela, para a próxima seção.
  private desenharSecao(doc: jsPDF, secao: SecaoRelatorio, y: number): number {
    const altura = doc.internal.pageSize.getHeight();

    // Sem esta quebra, um título que caísse no pé da página ficaria órfão: o
    // texto numa página e a tabela dele na seguinte.
    if (y + 22 > altura - RODAPE) {
      doc.addPage();
      y = TOPO_CONTINUACAO;
    }

    if (secao.titulo) {
      // Um tico dourado à esquerda marca onde cada bloco começa.
      doc.setFillColor(...DOURADO);
      doc.rect(MARGEM, y + 2.2, 1.6, 4.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...GRAFITE);
      doc.text(secao.titulo, MARGEM + 4, y + 6);
      y += 8;
    }

    autoTable(doc, {
      startY: y + 2,
      head: [secao.colunas],
      body: secao.linhas.map((linha) => linha.map((celula) => String(celula))),
      margin: { top: TOPO_CONTINUACAO, bottom: RODAPE, left: MARGEM, right: MARGEM },
      // Sem linhas verticais: as colunas se separam pelo espaço, e só um fio
      // claro embaixo de cada linha guia o olho.
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: FONTE_TABELA,
        cellPadding: PREENCHIMENTO_CELULA,
        overflow: 'linebreak',
        valign: 'middle',
        textColor: GRAFITE,
        lineColor: LINHA,
        lineWidth: { bottom: 0.1 },
      },
      headStyles: {
        fillColor: AZUL,
        textColor: 255,
        fontStyle: 'bold',
        lineWidth: 0,
      },
      alternateRowStyles: { fillColor: FUNDO_ALTERNADO },
      columnStyles: this.medirColunas(doc, secao),
    });

    // O autoTable guarda em `lastAutoTable` onde parou de desenhar.
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  /**
   * Reparte a largura da página entre as colunas.
   *
   * Deixado a cargo do autoTable, um texto longo (um nome de 100 caracteres,
   * o máximo que o formulário aceita) toma quase toda a linha e espreme as
   * outras colunas até virarem uma letra por linha. Aqui a conta é outra:
   * mede-se o quanto cada coluna *gostaria* de ocupar e, quando a soma não
   * cabe, aplica-se um teto — só as colunas acima dele são cortadas, e o texto
   * delas quebra em várias linhas. As colunas curtas ficam intactas.
   */
  private medirColunas(doc: jsPDF, secao: SecaoRelatorio): {
    [indice: number]: { cellWidth: number };
  } {
    const disponivel = doc.internal.pageSize.getWidth() - MARGEM * 2;
    const folga = PREENCHIMENTO_CELULA * 2;

    const desejadas = secao.colunas.map((coluna, indice) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTE_TABELA);
      let maior = doc.getTextWidth(coluna);

      doc.setFont('helvetica', 'normal');
      for (const linha of secao.linhas) {
        maior = Math.max(maior, doc.getTextWidth(String(linha[indice] ?? '')));
      }

      return maior + folga;
    });

    const total = desejadas.reduce((soma, largura) => soma + largura, 0);
    const finais =
      total <= disponivel
        ? // Sobra espaço: estica todas na mesma proporção, para a tabela ocupar
          // a largura inteira em vez de terminar no meio da página.
          desejadas.map((largura) => (largura * disponivel) / total)
        : this.aplicarTeto(desejadas, disponivel);

    const estilos: { [indice: number]: { cellWidth: number } } = {};
    finais.forEach((largura, indice) => (estilos[indice] = { cellWidth: largura }));
    return estilos;
  }

  // Acha o teto que faz a soma caber: as colunas que cabem abaixo dele ficam
  // como estão, e o que sobra é dividido em partes iguais entre as maiores.
  private aplicarTeto(desejadas: number[], disponivel: number): number[] {
    let restante = disponivel;
    let quantas = desejadas.length;

    for (const largura of [...desejadas].sort((a, b) => a - b)) {
      if (largura > restante / quantas) {
        break;
      }
      restante -= largura;
      quantas--;
    }

    const teto = quantas > 0 ? restante / quantas : disponivel;
    return desejadas.map((largura) => Math.min(largura, teto));
  }

  // A moldura de todas as páginas: o fio de continuação no topo (da segunda em
  // diante, já que a primeira tem a tarja) e o rodapé com a paginação. Só dá
  // para fazer no fim, porque antes disso ainda não se sabe quantas páginas o
  // documento terá.
  private desenharBordas(doc: jsPDF, relatorio: Relatorio): void {
    const total = doc.getNumberOfPages();
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();

    for (let pagina = 1; pagina <= total; pagina++) {
      doc.setPage(pagina);

      if (pagina > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...AZUL);
        doc.setCharSpace(1.4);
        doc.text(MARCA, MARGEM, 13);
        doc.setCharSpace(0);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...CINZA);
        doc.text(relatorio.titulo, largura - MARGEM, 13, { align: 'right' });

        doc.setDrawColor(...DOURADO);
        doc.setLineWidth(0.4);
        doc.line(MARGEM, 16, largura - MARGEM, 16);
      }

      doc.setDrawColor(...LINHA);
      doc.setLineWidth(0.2);
      doc.line(MARGEM, altura - 12, largura - MARGEM, altura - 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...AZUL);
      doc.text(MARCA, MARGEM, altura - 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CINZA);
      doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 8, { align: 'right' });
    }
  }

  // No navegador (e no desktop) o arquivo cai como download, e o Electron abre
  // o "Salvar como" do sistema. No Android não existe pasta de downloads
  // acessível direto pela página, então gravamos em cache e abrimos a folha de
  // compartilhamento para o usuário escolher o destino (salvar, e-mail,
  // WhatsApp...).
  private async entregar(doc: jsPDF, nomeArquivo: string): Promise<void> {
    if (this.plataforma === 'web' || this.plataforma === 'electron') {
      doc.save(nomeArquivo);
      return;
    }

    const { uri } = await Filesystem.writeFile({
      path: nomeArquivo,
      data: this.paraBase64(doc),
      directory: Directory.Cache,
    });

    await Share.share({ title: nomeArquivo, url: uri });
  }

  // Só o base64, sem o prefixo "data:application/pdf;base64,".
  private paraBase64(doc: jsPDF): string {
    return doc.output('datauristring').split(',')[1];
  }

  /** Pública porque a pré-visualização mostra a mesma data do PDF. */
  dataDeHoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }
}
