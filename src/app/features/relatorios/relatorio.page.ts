import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  IonModal,
  IonButton,
  IonButtons,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  businessOutline,
  musicalNotesOutline,
  calendarOutline,
  downloadOutline,
} from 'ionicons/icons';
import { RelatorioService } from '../../core/services/relatorio.service';
import { MusicoService } from '../../core/services/musico.service';
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { Musico } from '../../core/models/musico.model';
import { CasaOracao } from '../../core/models/casa-oracao.model';
import { PdfService, Relatorio } from '../../shared/services/pdf.service';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({
  peopleOutline,
  businessOutline,
  musicalNotesOutline,
  calendarOutline,
  downloadOutline,
});

/** Campos que um relatório pede antes de ser gerado. A tela monta o modal a
 *  partir desta lista, então incluir um filtro novo é só acrescentar aqui.
 *  `casa` já vem valendo "todas"; `casaObrigatoria` exige uma escolha. */
type CampoFiltro = 'musico' | 'periodo' | 'casa' | 'casaObrigatoria' | 'familias';

/** O que o modal devolve. Em `casaId`, 0 significa "todas as casas" e -1 que
 *  o usuário ainda não escolheu nada. */
interface ValoresFiltro {
  musicoId: number;
  casaId: number;
  familias: string[];
  dataInicial: string;
  dataFinal: string;
}

/** Nenhuma casa escolhida ainda — só o filtro obrigatório usa este estado. */
const CASA_NAO_ESCOLHIDA = -1;
const TODAS_AS_CASAS = 0;

/** Uma das quatro opções da tela. `montar` só é chamada quando o usuário
 *  escolhe o relatório — nada é consultado no banco antes disso. */
interface OpcaoRelatorio {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  /** Vazio = gera direto no clique; com itens = abre o modal de filtros antes. */
  campos: CampoFiltro[];
  montar: (filtro: ValoresFiltro) => Promise<Relatorio>;
}

@Component({
  selector: 'app-relatorio',
  templateUrl: './relatorio.page.html',
  styleUrls: ['./relatorio.page.scss'],
  imports: [
    ReactiveFormsModule,
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
    IonModal,
    IonButton,
    IonButtons,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
})
export class RelatorioPage {
  private readonly relatorioService = inject(RelatorioService);
  private readonly musicoService = inject(MusicoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pdf = inject(PdfService);
  private readonly confirmacao = inject(ConfirmacaoService);

  /** Id do relatório sendo gerado, ou null quando nada está em andamento.
   *  Serve para mostrar o spinner na linha certa e evitar toques repetidos. */
  gerando: string | null = null;

  /** Relatório aguardando os filtros, ou null com o modal fechado. */
  emFiltro: OpcaoRelatorio | null = null;

  // Carregados sob demanda, só quando o modal que usa cada lista abre.
  musicos: Musico[] = [];
  casas: CasaOracao[] = [];
  familias: string[] = [];

  filtros = this.formBuilder.nonNullable.group({
    // 0 = nada escolhido. No músico isso barra o formulário; na casa de oração
    // é um valor legítimo e significa "todas".
    musicoId: [0],
    casaId: [TODAS_AS_CASAS],
    familias: [[] as string[]],
    dataInicial: [''],
    dataFinal: [''],
  });

  readonly opcoes: OpcaoRelatorio[] = [
    {
      id: 'musicos',
      titulo: 'Por Músico',
      descricao: 'Os eventos de que um músico participou dentro de um período.',
      icone: 'people-outline',
      campos: ['musico', 'periodo'],
      montar: (filtro) =>
        this.relatorioService.porMusico({
          musicoId: filtro.musicoId,
          dataInicial: filtro.dataInicial,
          dataFinal: filtro.dataFinal,
        }),
    },
    {
      id: 'casas',
      titulo: 'Por Casa de Oração',
      descricao: 'Os músicos de cada casa, com o total de músicos por casa no fim.',
      icone: 'business-outline',
      campos: ['casaObrigatoria'],
      montar: (filtro) => this.relatorioService.porCasaOracao({ casaId: this.casaOuTodas(filtro) }),
    },
    {
      id: 'familias',
      titulo: 'Por Família de Instrumentos',
      descricao: 'Os músicos de cada família, com a relação final das orquestras.',
      icone: 'musical-notes-outline',
      campos: ['familias', 'casa'],
      montar: (filtro) =>
        this.relatorioService.porFamiliaInstrumento({
          familias: filtro.familias,
          casaId: this.casaOuTodas(filtro),
        }),
    },
    {
      id: 'eventos',
      titulo: 'Por Evento',
      descricao: 'Os participantes de cada evento do período, com a relação da orquestra.',
      icone: 'calendar-outline',
      campos: ['periodo', 'casa'],
      montar: (filtro) =>
        this.relatorioService.porEvento({
          dataInicial: filtro.dataInicial,
          dataFinal: filtro.dataFinal,
          casaId: this.casaOuTodas(filtro),
        }),
    },
  ];

  // O select usa 0 para "todas" (e -1 para "ainda não escolhi"); o serviço
  // espera null nesses dois casos.
  private casaOuTodas(filtro: ValoresFiltro): number | null {
    return filtro.casaId > 0 ? filtro.casaId : null;
  }

  precisaDe(campo: CampoFiltro): boolean {
    return this.emFiltro?.campos.includes(campo) ?? false;
  }

  // Data final antes da inicial: o BETWEEN não devolveria nada e o usuário
  // ficaria sem entender por quê, então o erro aparece antes de gerar.
  get periodoInvertido(): boolean {
    const { dataInicial, dataFinal } = this.filtros.getRawValue();
    return dataInicial !== '' && dataFinal !== '' && dataInicial > dataFinal;
  }

  // Cada campo só é exigido quando o relatório escolhido realmente o mostra.
  get filtroInvalido(): boolean {
    const valores = this.filtros.getRawValue();

    if (this.precisaDe('periodo')) {
      if (!valores.dataInicial || !valores.dataFinal || this.periodoInvertido) {
        return true;
      }
    }
    if (this.precisaDe('musico') && valores.musicoId < 1) {
      return true;
    }
    if (this.precisaDe('familias') && valores.familias.length === 0) {
      return true;
    }
    if (this.precisaDe('casaObrigatoria') && valores.casaId === CASA_NAO_ESCOLHIDA) {
      return true;
    }
    return false;
  }

  // Relatório sem filtro vai direto; com filtro, abre o modal primeiro.
  async escolher(opcao: OpcaoRelatorio): Promise<void> {
    if (this.gerando) {
      return;
    }

    if (opcao.campos.length === 0) {
      await this.gerar(opcao);
      return;
    }

    if (opcao.campos.includes('musico') && this.musicos.length === 0) {
      this.musicos = await this.musicoService.listarTodos();
    }
    if (this.usaCasa(opcao) && this.casas.length === 0) {
      this.casas = await this.casaOracaoService.listarTodos();
    }
    if (opcao.campos.includes('familias') && this.familias.length === 0) {
      this.familias = await this.relatorioService.listarFamilias();
    }

    this.filtros.reset({
      musicoId: 0,
      // No filtro obrigatório o select começa vazio, para a escolha ser
      // consciente; no opcional já vale para todas as casas.
      casaId: opcao.campos.includes('casaObrigatoria') ? CASA_NAO_ESCOLHIDA : TODAS_AS_CASAS,
      familias: [],
      dataInicial: '',
      dataFinal: '',
    });
    this.emFiltro = opcao;
  }

  private usaCasa(opcao: OpcaoRelatorio): boolean {
    return opcao.campos.includes('casa') || opcao.campos.includes('casaObrigatoria');
  }

  fecharFiltro(): void {
    this.emFiltro = null;
  }

  async confirmarFiltro(): Promise<void> {
    const opcao = this.emFiltro;
    if (!opcao || this.filtroInvalido) {
      return;
    }

    this.emFiltro = null;
    await this.gerar(opcao);
  }

  // Monta os dados e entrega o PDF. Se não houver nada para mostrar, avisa em
  // vez de gerar um arquivo vazio.
  private async gerar(opcao: OpcaoRelatorio): Promise<void> {
    this.gerando = opcao.id;
    try {
      const relatorio = await opcao.montar(this.filtros.getRawValue());

      if (relatorio.secoes.every((secao) => secao.linhas.length === 0)) {
        await this.confirmacao.avisar(
          'Nada para gerar',
          opcao.campos.length > 0
            ? `Nenhum resultado para os filtros escolhidos no relatório "${opcao.titulo}".`
            : `Ainda não há dados cadastrados para o relatório "${opcao.titulo}".`
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
