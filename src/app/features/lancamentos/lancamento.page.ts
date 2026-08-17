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
  // Vazio = dá para cadastrar. Com itens, o botão de novo lançamento fica
  // desabilitado e a tela explica o que falta.
  faltando: PreRequisito[] = [];
  carregando = true;

  // Ids dos lançamentos com a relação de músicos aberta. Todo card nasce
  // fechado: com trinta ou mais nomes, mostrá-los sempre afogava a data, o
  // evento e a casa de oração — que é o que se procura ao correr a lista.
  //
  // Guardar por id, e não uma bandeira dentro do lançamento, é o que faz a
  // escolha sobreviver ao recarregamento: a tela se recarrega inteira a cada
  // gravação no banco (ver o effect no construtor), e o que estava aberto
  // fecharia sozinho no meio do uso.
  private readonly abertos = new Set<number>();

  // Os três filtros da tela. O texto casa evento, casa de oração e nome de
  // músico participante; o período recorta por data. São independentes: valem
  // sozinhos ou combinados.
  termoBusca = '';
  dataInicial = '';
  dataFinal = '';

  // Limites do <input type="date">, os mesmos do resto do app.
  protected readonly dataMinima = dataMinima();
  protected readonly dataMaxima = dataMaxima();

  constructor() {
    // Carrega na criação da tela e recarrega sozinha sempre que algo é gravado
    // no banco (criar/editar/excluir, aqui ou em outra tela). Isso também cobre
    // mudanças indiretas: renomear um evento ou uma casa muda o que os cards
    // desta lista exibem.
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

  /**
   * Os lançamentos que sobram depois dos filtros.
   *
   * A data guardada é 'YYYY-MM-DD', que é ordenável como texto: comparar
   * string com string já dá o resultado certo, sem converter para Date.
   *
   * O texto casa também o nome dos músicos participantes, e não só evento e
   * casa: "onde o João tocou" é uma das perguntas que esta tela recebe, e a
   * resposta já está carregada em memória (a consulta traz os músicos junto).
   */
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

  /** Se há algum filtro em uso — o que decide mostrar o botão de limpar. */
  filtrando(): boolean {
    return this.termoBusca.trim() !== '' || this.dataInicial !== '' || this.dataFinal !== '';
  }

  // Data final antes da inicial não devolveria nada, e o usuário ficaria sem
  // entender por que a lista sumiu. O aviso aparece antes de ele procurar.
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

  // O que o card mostra com a relação fechada. O singular existe porque
  // "1 músicos" salta aos olhos numa lista em que quase todo lançamento tem um
  // punhado deles.
  resumoMusicos(lancamento: LancamentoComMusicos): string {
    const quantidade = lancamento.musicos.length;
    return quantidade === 1 ? '1 músico' : `${quantidade} músicos`;
  }

  // Pergunta antes de excluir; a exclusão é lógica (marca ativo = 0), então o
  // registro apenas some da lista.
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

  // Converte a data guardada como 'YYYY-MM-DD' para o formato brasileiro DD/MM/YYYY.
  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
