import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SecaoRelatorio {
  titulo?: string;
  colunas: string[];
  linhas: (string | number)[][];
  centralizarAPartirDe?: number;
  repetirColunas?: number;
  colunasFinais?: number;
  novaPagina?: boolean;
}

export interface Relatorio {
  titulo: string;
  subtitulo?: string;
  nomeArquivo: string;
  paisagem?: boolean;
  secoes: SecaoRelatorio[];
}

const MARCA = 'SRME';

export const NAO_SE_APLICA = '–';

const MARGEM = 14;
const TOPO_CONTINUACAO = 26;
const RODAPE = 18;

const ALTURA_TARJA = 28;

const FONTE_TABELA = 9;
const PREENCHIMENTO_CELULA = 2.2;

const AZUL: [number, number, number] = [30, 90, 142];
const DOURADO: [number, number, number] = [200, 138, 46];
const GRAFITE: [number, number, number] = [28, 37, 48];
const CINZA: [number, number, number] = [107, 118, 132];
const AZUL_CLARO: [number, number, number] = [186, 205, 222];
const LINHA: [number, number, number] = [214, 223, 232];
const FUNDO_ALTERNADO: [number, number, number] = [240, 244, 249];

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private readonly plataforma = Capacitor.getPlatform();

  get temPreVisualizacao(): boolean {
    return this.plataforma === 'web' || this.plataforma === 'electron';
  }

  async gerar(relatorio: Relatorio): Promise<void> {
    const doc = this.novoDocumento(relatorio);

    let y = this.desenharCabecalho(doc, relatorio);

    for (const secao of this.dividirEmFolhas(relatorio, doc).secoes) {
      y = this.desenharSecao(doc, secao, y);
    }

    this.desenharBordas(doc, relatorio);
    await this.entregar(doc, `${relatorio.nomeArquivo}.pdf`);
  }

  dividirEmFolhas(relatorio: Relatorio, doc = this.novoDocumento(relatorio)): Relatorio {
    return {
      ...relatorio,
      secoes: ([] as SecaoRelatorio[]).concat(
        ...relatorio.secoes.map((secao) => this.dividirColunas(doc, secao))
      ),
    };
  }

  private novoDocumento(relatorio: Relatorio): jsPDF {
    return new jsPDF({
      orientation: relatorio.paisagem ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  private desenharCabecalho(doc: jsPDF, relatorio: Relatorio): number {
    const largura = doc.internal.pageSize.getWidth();

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, largura, ALTURA_TARJA, 'F');

    doc.setFillColor(...DOURADO);
    doc.rect(0, ALTURA_TARJA, largura, 1.2, 'F');

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

  private desenharSecao(doc: jsPDF, secao: SecaoRelatorio, y: number): number {
    const altura = doc.internal.pageSize.getHeight();

    if ((secao.novaPagina && y > TOPO_CONTINUACAO) || y + 22 > altura - RODAPE) {
      doc.addPage();
      y = TOPO_CONTINUACAO;
    }

    if (secao.titulo) {
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
      showHead: 'everyPage',
      head: [secao.colunas],
      body: secao.linhas.map((linha) => linha.map((celula) => String(celula))),
      margin: { top: TOPO_CONTINUACAO, bottom: RODAPE, left: MARGEM, right: MARGEM },
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
      didParseCell: (celula) => {
        const inicio = secao.centralizarAPartirDe;
        if (inicio !== undefined && celula.column.index >= inicio) {
          celula.cell.styles.halign = 'center';
        }
        if (celula.section === 'body' && celula.cell.raw === NAO_SE_APLICA) {
          celula.cell.styles.textColor = CINZA;
        }
      },
    });

    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  private dividirColunas(doc: jsPDF, secao: SecaoRelatorio): SecaoRelatorio[] {
    const inicio = secao.repetirColunas;
    if (inicio === undefined) {
      return [secao];
    }

    const disponivel = doc.internal.pageSize.getWidth() - MARGEM * 2;
    const minimas = secao.colunas.map((_, indice) => this.larguraMinima(doc, secao, indice));
    const fim = secao.colunas.length - (secao.colunasFinais ?? 0);
    const soma = (indices: number[]): number =>
      indices.reduce((total, indice) => total + minimas[indice], 0);

    const repetidas = Array.from({ length: inicio }, (_, i) => i);
    const finais = Array.from({ length: secao.colunas.length - fim }, (_, i) => fim + i);
    const meio = Array.from({ length: fim - inicio }, (_, i) => inicio + i);

    let grupos: number[][] = [meio];
    for (let partes = 1; partes <= meio.length; partes++) {
      grupos = this.repartir(meio, partes);
      const cabem = grupos.every(
        (grupo, indice) =>
          soma([...repetidas, ...grupo, ...(indice === grupos.length - 1 ? finais : [])]) <=
          disponivel
      );
      if (cabem) {
        break;
      }
    }

    if (grupos.length === 1) {
      return [secao];
    }

    return grupos.map((grupo, indice) => {
      const ultimo = indice === grupos.length - 1;
      const colunas = [...repetidas, ...grupo, ...(ultimo ? finais : [])];
      return {
        ...secao,
        titulo: secao.titulo
          ? `${secao.titulo} — parte ${indice + 1} de ${grupos.length}`
          : undefined,
        colunas: colunas.map((coluna) => secao.colunas[coluna]),
        linhas: secao.linhas.map((linha) => colunas.map((coluna) => linha[coluna])),
        colunasFinais: ultimo ? secao.colunasFinais : undefined,
        novaPagina: secao.novaPagina || indice > 0,
      };
    });
  }

  private repartir(indices: number[], partes: number): number[][] {
    const tamanho = Math.floor(indices.length / partes);
    const sobra = indices.length % partes;
    const grupos: number[][] = [];
    let posicao = 0;
    for (let parte = 0; parte < partes; parte++) {
      const quantos = tamanho + (parte < sobra ? 1 : 0);
      grupos.push(indices.slice(posicao, posicao + quantos));
      posicao += quantos;
    }
    return grupos;
  }

  private medirColunas(doc: jsPDF, secao: SecaoRelatorio): {
    [indice: number]: { cellWidth: number };
  } {
    const disponivel = doc.internal.pageSize.getWidth() - MARGEM * 2;
    const folga = PREENCHIMENTO_CELULA * 2;

    const desejadas = secao.colunas.map((coluna, indice) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTE_TABELA);
      let maior = Math.max(...coluna.split('\n').map((parte) => doc.getTextWidth(parte)));

      doc.setFont('helvetica', 'normal');
      for (const linha of secao.linhas) {
        maior = Math.max(maior, doc.getTextWidth(String(linha[indice] ?? '')));
      }

      return maior + folga;
    });

    const total = desejadas.reduce((soma, largura) => soma + largura, 0);
    const minimas = secao.colunas.map((_, indice) => this.larguraMinima(doc, secao, indice));
    const somaMinimas = minimas.reduce((soma, largura) => soma + largura, 0);

    let finais: number[];
    if (total <= disponivel) {
      finais = desejadas.map((largura) => (largura * disponivel) / total);
    } else if (somaMinimas <= disponivel) {
      const fator = (disponivel - somaMinimas) / (total - somaMinimas);
      finais = minimas.map((minima, indice) => minima + (desejadas[indice] - minima) * fator);
    } else {
      finais = this.aplicarTeto(desejadas, disponivel);
    }

    const larguras: { [indice: number]: { cellWidth: number } } = {};
    finais.forEach((largura, indice) => (larguras[indice] = { cellWidth: largura }));
    return larguras;
  }

  private larguraMinima(doc: jsPDF, secao: SecaoRelatorio, indice: number): number {
    const inteira = indice < (secao.repetirColunas ?? 0);
    let maior = this.maiorPalavra(doc, secao.colunas[indice], 'bold');
    for (const linha of secao.linhas) {
      const celula = String(linha[indice] ?? '');
      maior = Math.max(
        maior,
        inteira ? this.maiorPalavra(doc, celula, 'normal', /\n/) : this.maiorPalavra(doc, celula, 'normal')
      );
    }
    return maior + PREENCHIMENTO_CELULA * 2;
  }

  private maiorPalavra(
    doc: jsPDF,
    texto: string,
    estilo: 'bold' | 'normal',
    separador: RegExp = /\s+/
  ): number {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(FONTE_TABELA);
    return Math.max(0, ...texto.split(separador).map((parte) => doc.getTextWidth(parte)));
  }

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

  private paraBase64(doc: jsPDF): string {
    return doc.output('datauristring').split(',')[1];
  }

  dataDeHoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }
}
