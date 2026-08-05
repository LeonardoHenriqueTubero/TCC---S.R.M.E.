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
  IonList,
  IonItem,
  IonLabel,
  IonNote,
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
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { CasaOracao } from '../../core/models/casa-oracao.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({ addOutline, createOutline, trashOutline });

@Component({
  selector: 'app-casa-oracao',
  templateUrl: './casa-oracao.page.html',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonButton,
  ],
})
export class CasaOracaoPage {
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly database = inject(Database);

  casas: CasaOracao[] = [];
  carregando = true;

  constructor() {
    // Carrega na criação da tela e recarrega sozinha sempre que algo é gravado
    // no banco (criar/editar/excluir, aqui ou em outra tela). Sem isso a lista
    // ficaria desatualizada até recarregar a página, porque o Ionic mantém as
    // páginas de aba vivas e o ionViewWillEnter não dispara de novo.
    effect(() => {
      this.database.versaoDados();
      this.carregar();
    });
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.casas = await this.casaOracaoService.listarTodos();
    this.carregando = false;
  }

  // Bloqueia a exclusão se a casa ainda estiver em uso; caso contrário pergunta
  // antes de excluir. A exclusão é lógica (marca ativo = 0), então o registro
  // apenas some da lista.
  async excluir(casa: CasaOracao): Promise<void> {
    if (casa.id === undefined) {
      return;
    }

    const usos = await this.casaOracaoService.descreverUsos(casa.id);
    if (usos) {
      await this.confirmacao.avisar(
        'Não é possível excluir',
        `A casa de oração "${casa.nome}" está sendo usada por ${usos}. ` +
          'Troque ou exclua esses registros antes de excluí-la.'
      );
      return;
    }

    const confirmado = await this.confirmacao.confirmarExclusao(`a casa de oração "${casa.nome}"`);
    if (!confirmado) {
      return;
    }

    await this.casaOracaoService.excluir(casa.id);
    await this.carregar();
  }
}
