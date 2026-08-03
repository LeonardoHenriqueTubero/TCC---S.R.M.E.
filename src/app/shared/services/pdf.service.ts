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

const MARGEM = 14;
const COR_CABECALHO: [number, number, number] = [56, 128, 255]; // primary do Ionic

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

  async gerar(relatorio: Relatorio): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let y = this.desenharCabecalho(doc, relatorio);

    for (const secao of relatorio.secoes) {
      y = this.desenharSecao(doc, secao, y);
    }

    this.desenharRodape(doc);
    await this.entregar(doc, `${relatorio.nomeArquivo}.pdf`);
  }

  // Título, subtítulo e data de emissão. Devolve o Y onde a primeira tabela começa.
  private desenharCabecalho(doc: jsPDF, relatorio: Relatorio): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(relatorio.titulo, MARGEM, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(110);

    let y = 26;
    if (relatorio.subtitulo) {
      doc.text(relatorio.subtitulo, MARGEM, y);
      y += 5;
    }
    doc.text(`Emitido em ${this.dataDeHoje()}`, MARGEM, y);
    doc.setTextColor(0);

    return y + 6;
  }

  // Desenha uma tabela e devolve o Y logo abaixo dela, para a próxima seção.
  private desenharSecao(doc: jsPDF, secao: SecaoRelatorio, y: number): number {
    if (secao.titulo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(secao.titulo, MARGEM, y + 6);
      y += 8;
    }

    autoTable(doc, {
      startY: y + 2,
      head: [secao.colunas],
      body: secao.linhas.map((linha) => linha.map((celula) => String(celula))),
      margin: { left: MARGEM, right: MARGEM },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: COR_CABECALHO, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // O autoTable guarda em `lastAutoTable` onde parou de desenhar.
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // "Página X de Y" em todas as páginas. Só dá para fazer no fim, porque antes
  // disso ainda não se sabe quantas páginas o documento terá.
  private desenharRodape(doc: jsPDF): void {
    const total = doc.getNumberOfPages();
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();

    for (let pagina = 1; pagina <= total; pagina++) {
      doc.setPage(pagina);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130);
      doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 8, { align: 'right' });
      doc.text('SRME', MARGEM, altura - 8);
    }
  }

  // No navegador (e no Electron) o arquivo cai como download. No Android não
  // existe pasta de downloads acessível direto pela página, então gravamos em
  // cache e abrimos a folha de compartilhamento para o usuário escolher o
  // destino (salvar, e-mail, WhatsApp...).
  private async entregar(doc: jsPDF, nomeArquivo: string): Promise<void> {
    if (this.plataforma === 'web' || this.plataforma === 'electron') {
      doc.save(nomeArquivo);
      return;
    }

    const { uri } = await Filesystem.writeFile({
      path: nomeArquivo,
      data: doc.output('datauristring').split(',')[1], // só o base64, sem o prefixo
      directory: Directory.Cache,
    });

    await Share.share({ title: nomeArquivo, url: uri });
  }

  private dataDeHoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }
}
