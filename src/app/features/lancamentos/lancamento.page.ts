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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronDownOutline,
  chevronUpOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { Database } from '../../core/database/database';
import { LancamentoService } from '../../core/services/lancamento.service';
import { LancamentoComMusicos } from '../../core/models/lancamento-musico.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';
import { BotaoTemaComponent } from '../../shared/components/botao-tema.component';
import { AvisoPreRequisitosComponent } from '../../shared/components/aviso-pre-requisitos.component';
import { PreRequisito, PreRequisitosService } from '../../core/services/pre-requisitos.service';

addIcons({ addOutline, chevronDownOutline, chevronUpOutline, createOutline, trashOutline });

@Component({
  selector: 'app-lancamento',
  templateUrl: './lancamento.page.html',
  styleUrls: ['./lancamento.page.scss'],
  imports: [
    AvisoPreRequisitosComponent,
    BotaoTemaComponent,
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
