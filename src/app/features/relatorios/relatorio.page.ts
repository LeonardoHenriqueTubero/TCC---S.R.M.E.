import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  businessOutline,
  musicalNotesOutline,
  clipboardOutline,
  downloadOutline,
} from 'ionicons/icons';
import { RelatorioService } from '../../core/services/relatorio.service';
import { PdfService, Relatorio } from '../../shared/services/pdf.service';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({
  peopleOutline,
  businessOutline,
  musicalNotesOutline,
  clipboardOutline,
  downloadOutline,
});

/** Uma das quatro opções da tela. `montar` só é chamada quando o usuário
 *  escolhe o relatório — nada é consultado no banco antes disso. */
interface OpcaoRelatorio {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  montar: () => Promise<Relatorio>;
}

@Component({
  selector: 'app-relatorio',
  templateUrl: './relatorio.page.html',
  styleUrls: ['./relatorio.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonNote,
  ],
})
export class RelatorioPage {
  private readonly relatorioService = inject(RelatorioService);
  private readonly pdf = inject(PdfService);
  private readonly confirmacao = inject(ConfirmacaoService);

  /** Id do relatório sendo gerado, ou null quando nada está em andamento.
   *  Serve para mostrar o spinner na linha certa e evitar toques repetidos. */
  gerando: string | null = null;

  readonly opcoes: OpcaoRelatorio[] = [
    {
      id: 'musicos',
      titulo: 'Por Músico',
      descricao: 'Todos os músicos com instrumento, casa de oração e cargo.',
      icone: 'people-outline',
      montar: () => this.relatorioService.porMusico(),
    },
    {
      id: 'casas',
      titulo: 'Por Casa de Oração',
      descricao: 'Uma tabela por casa, com os músicos que pertencem a ela.',
      icone: 'business-outline',
      montar: () => this.relatorioService.porCasaOracao(),
    },
    {
      id: 'familias',
      titulo: 'Por Família de Instrumentos',
      descricao: 'Cordas, madeiras e metais, com quantos músicos tocam cada instrumento.',
      icone: 'musical-notes-outline',
      montar: () => this.relatorioService.porFamiliaInstrumento(),
    },
    {
      id: 'lancamentos',
      titulo: 'Por Lançamento',
      descricao: 'Cada lançamento com evento, local e os músicos presentes.',
      icone: 'clipboard-outline',
      montar: () => this.relatorioService.porLancamento(),
    },
  ];

  // Monta os dados e entrega o PDF. Se não houver nada para mostrar, avisa em
  // vez de gerar um arquivo vazio.
  async gerar(opcao: OpcaoRelatorio): Promise<void> {
    if (this.gerando) {
      return;
    }

    this.gerando = opcao.id;
    try {
      const relatorio = await opcao.montar();

      if (relatorio.secoes.every((secao) => secao.linhas.length === 0)) {
        await this.confirmacao.avisar(
          'Nada para gerar',
          `Ainda não há dados cadastrados para o relatório "${opcao.titulo}".`
        );
        return;
      }

      await this.pdf.gerar(relatorio);
    } catch (erro) {
      await this.confirmacao.avisar(
        'Não foi possível gerar o PDF',
        erro instanceof Error ? erro.message : 'Tente novamente.'
      );
    } finally {
      this.gerando = null;
    }
  }
}
