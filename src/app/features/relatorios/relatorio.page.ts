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
import { EventoService } from '../../core/services/evento.service';
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { Evento } from '../../core/models/evento.model';
import { CasaOracao } from '../../core/models/casa-oracao.model';
import { PdfService, Relatorio } from '../../shared/services/pdf.service';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';
import { BotaoTemaComponent } from '../../shared/components/botao-tema.component';
import { MenuBotaoComponent } from '../../shared/components/menu-botao.component';
import { SelecaoAdaptavelDirective } from '../../shared/directives/selecao-adaptavel.directive';
import { VisualizacaoRelatorioComponent } from './visualizacao-relatorio.component';
import { comoBrasileiro, dataDentroDoIntervalo, dataMaxima, dataMinima } from '../../core/limites';

addIcons({
  peopleOutline,
  businessOutline,
  musicalNotesOutline,
  calendarOutline,
  downloadOutline,
});

type CampoFiltro = 'mesAno' | 'evento' | 'periodo' | 'casa' | 'casaObrigatoria' | 'familias';

interface ValoresFiltro {
  mes: number;
  ano: number;
  eventoId: number;
  somenteMusicosDaCasa: boolean;
  casaId: number;
  familias: string[];
  dataInicial: string;
  dataFinal: string;
}

const CASA_NAO_ESCOLHIDA = -1;
const TODAS_AS_CASAS = 0;

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface OpcaoRelatorio {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  campos: CampoFiltro[];
  montar: (filtro: ValoresFiltro) => Promise<Relatorio>;
}

@Component({
  selector: 'app-relatorio',
  templateUrl: './relatorio.page.html',
  styleUrls: ['./relatorio.page.scss'],
  imports: [
    VisualizacaoRelatorioComponent,
    SelecaoAdaptavelDirective,
    BotaoTemaComponent,
    MenuBotaoComponent,
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
  protected readonly dataMinima = dataMinima();
  protected readonly dataMaxima = dataMaxima();
  protected readonly intervaloDeDatas =
    `${comoBrasileiro(dataMinima())} e ${comoBrasileiro(dataMaxima())}`;
  protected readonly meses = MESES;
  protected readonly anos = this.anosDisponiveis();

  private readonly relatorioService = inject(RelatorioService);
  private readonly eventoService = inject(EventoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pdf = inject(PdfService);
  private readonly confirmacao = inject(ConfirmacaoService);

  gerando: string | null = null;

  emFiltro: OpcaoRelatorio | null = null;

  emVisualizacao: Relatorio | null = null;

  eventos: Evento[] = [];
  casas: CasaOracao[] = [];
  familias: string[] = [];

  filtros = this.formBuilder.nonNullable.group({
    mes: [new Date().getMonth() + 1],
    ano: [new Date().getFullYear()],
    eventoId: [0],
    somenteMusicosDaCasa: [true],
    casaId: [TODAS_AS_CASAS],
    familias: [[] as string[]],
    dataInicial: ['', dataDentroDoIntervalo()],
    dataFinal: ['', dataDentroDoIntervalo()],
  });

  readonly opcoes: OpcaoRelatorio[] = [
    {
      id: 'musicos',
      titulo: 'Por Músico',
      descricao: 'A presença (P) e as faltas (F) de cada músico nas datas de um evento no mês.',
      icone: 'people-outline',
      campos: ['mesAno', 'evento', 'casa'],
      montar: (filtro) =>
        this.relatorioService.porMusico({
          ano: filtro.ano,
          mes: filtro.mes,
          eventoId: filtro.eventoId,
          casaId: this.casaOuTodas(filtro),
          somenteMusicosDaCasa: filtro.somenteMusicosDaCasa,
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

  emitidoEm(): string {
    return this.pdf.dataDeHoje();
  }

  fecharVisualizacao(): void {
    this.emVisualizacao = null;
  }

  async baixarDaVisualizacao(): Promise<void> {
    const relatorio = this.emVisualizacao;
    if (!relatorio) {
      return;
    }

    try {
      await this.pdf.gerar(relatorio);
    } catch (erro) {
      await this.confirmacao.avisar(
        'Não foi possível gerar o PDF',
        erro instanceof Error ? erro.message : 'Tente novamente.'
      );
    }
  }

  private casaOuTodas(filtro: ValoresFiltro): number | null {
    return filtro.casaId > 0 ? filtro.casaId : null;
  }

  private anosDisponiveis(): number[] {
    const ultimo = Number(dataMaxima().slice(0, 4));
    const primeiro = Number(dataMinima().slice(0, 4));
    return Array.from({ length: ultimo - primeiro + 1 }, (_, i) => ultimo - i);
  }

  get escolheuUmaCasa(): boolean {
    return this.filtros.controls.casaId.value > 0;
  }

  precisaDe(campo: CampoFiltro): boolean {
    return this.emFiltro?.campos.includes(campo) ?? false;
  }

  get periodoInvertido(): boolean {
    const { dataInicial, dataFinal } = this.filtros.getRawValue();
    return dataInicial !== '' && dataFinal !== '' && dataInicial > dataFinal;
  }

  get filtroInvalido(): boolean {
    const valores = this.filtros.getRawValue();

    if (this.precisaDe('periodo')) {
      if (!valores.dataInicial || !valores.dataFinal || this.periodoInvertido) {
        return true;
      }
      if (this.filtros.controls.dataInicial.invalid || this.filtros.controls.dataFinal.invalid) {
        return true;
      }
    }
    if (this.precisaDe('evento') && valores.eventoId < 1) {
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

  async escolher(opcao: OpcaoRelatorio): Promise<void> {
    if (this.gerando) {
      return;
    }

    if (opcao.campos.length === 0) {
      await this.gerar(opcao);
      return;
    }

    if (opcao.campos.includes('evento') && this.eventos.length === 0) {
      this.eventos = await this.eventoService.listarTodos();
    }
    if (this.usaCasa(opcao) && this.casas.length === 0) {
      this.casas = await this.casaOracaoService.listarTodos();
    }
    if (opcao.campos.includes('familias') && this.familias.length === 0) {
      this.familias = await this.relatorioService.listarFamilias();
    }

    this.filtros.reset({
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      eventoId: 0,
      somenteMusicosDaCasa: true,
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

      if (this.pdf.temPreVisualizacao) {
        this.emVisualizacao = relatorio;
      } else {
        await this.pdf.gerar(relatorio);
      }
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
