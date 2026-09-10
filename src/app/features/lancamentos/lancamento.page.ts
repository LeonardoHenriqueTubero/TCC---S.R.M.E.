import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonButton,
  IonInput,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { Database } from '../../core/database/database';
import { LancamentoService } from '../../core/services/lancamento.service';
import { LancamentoComMusicos } from '../../core/models/lancamento-musico.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';
import { BotaoTemaComponent } from '../../shared/components/botao-tema.component';
import { MenuBotaoComponent } from '../../shared/components/menu-botao.component';
import { AvisoPreRequisitosComponent } from '../../shared/components/aviso-pre-requisitos.component';
import { PreRequisito, PreRequisitosService } from '../../core/services/pre-requisitos.service';
import { BarraBuscaComponent } from '../../shared/components/barra-busca.component';
import { contemTermo } from '../../core/texto';
import { dataMaxima, dataMinima } from '../../core/limites';

addIcons({
  addOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  createOutline,
  trashOutline,
});

@Component({
  selector: 'app-lancamento',
  templateUrl: './lancamento.page.html',
  styleUrls: ['./lancamento.page.scss'],
  imports: [
    BarraBuscaComponent,
    AvisoPreRequisitosComponent,
    BotaoTemaComponent,
    MenuBotaoComponent,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonButton,
    IonInput,
    IonNote,
  ],
})
export class LancamentoPage {
  private readonly lancamentoService = inject(LancamentoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly database = inject(Database);
  private readonly preRequisitos = inject(PreRequisitosService);

  lancamentos: LancamentoComMusicos[] = [];
  faltando: PreRequisito[] = [];
  carregando = true;

  private readonly abertos = new Set<number>();

  termoBusca = '';
  dataInicial = '';
  dataFinal = '';

  protected readonly dataMinima = dataMinima();
  protected readonly dataMaxima = dataMaxima();

  constructor() {
    effect(() => {
      this.database.versaoDados();
      this.carregar();
    });
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    [this.lancamentos, this.faltando] = await Promise.all([
      this.lancamentoService.listarComMusicos(),
      this.preRequisitos.paraLancamento(),
    ]);
    this.carregando = false;
  }

  lancamentosFiltrados(): LancamentoComMusicos[] {
    return this.lancamentos.filter((lancamento) => {
      if (this.dataInicial && lancamento.data < this.dataInicial) {
        return false;
      }
      if (this.dataFinal && lancamento.data > this.dataFinal) {
        return false;
      }
      return contemTermo(
        this.termoBusca,
        lancamento.nomeEvento,
        lancamento.nomeCasaOracao,
        ...lancamento.musicos.map((musico) => musico.nome)
      );
    });
  }

  filtrando(): boolean {
    return this.termoBusca.trim() !== '' || this.dataInicial !== '' || this.dataFinal !== '';
  }

  get periodoInvertido(): boolean {
    return this.dataInicial !== '' && this.dataFinal !== '' && this.dataInicial > this.dataFinal;
  }

  limparFiltros(): void {
    this.termoBusca = '';
    this.dataInicial = '';
    this.dataFinal = '';
  }

  estaAberto(lancamentoId: number): boolean {
    return this.abertos.has(lancamentoId);
  }

  alternarMusicos(lancamentoId: number): void {
    if (!this.abertos.delete(lancamentoId)) {
      this.abertos.add(lancamentoId);
    }
  }

  resumoMusicos(lancamento: LancamentoComMusicos): string {
    const quantidade = lancamento.musicos.length;
    return quantidade === 1 ? '1 músico' : `${quantidade} músicos`;
  }

  async excluir(lancamento: LancamentoComMusicos): Promise<void> {
    const confirmado = await this.confirmacao.confirmarExclusao(
      `o lançamento de ${this.formatarData(lancamento.data)} (${lancamento.nomeEvento})`
    );
    if (!confirmado) {
      return;
    }

    await this.lancamentoService.excluir(lancamento.id);
    await this.carregar();
  }

  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
