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
  IonChip,
  IonLabel,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { Database } from '../../core/database/database';
import { LancamentoService } from '../../core/services/lancamento.service';
import { LancamentoComMusicos } from '../../core/models/lancamento-musico.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({ addOutline, createOutline, trashOutline });

@Component({
  selector: 'app-lancamento',
  templateUrl: './lancamento.page.html',
  styleUrls: ['./lancamento.page.scss'],
  imports: [
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
    IonChip,
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

  lancamentos: LancamentoComMusicos[] = [];
  carregando = true;

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
    this.lancamentos = await this.lancamentoService.listarComMusicos();
    this.carregando = false;
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
