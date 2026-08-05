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
import { EventoService } from '../../core/services/evento.service';
import { Evento } from '../../core/models/evento.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({ addOutline, createOutline, trashOutline });

@Component({
  selector: 'app-evento',
  templateUrl: './evento.page.html',
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
    IonSpinner,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonButton,
  ],
})
export class EventoPage {
  private readonly eventoService = inject(EventoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly database = inject(Database);

  eventos: Evento[] = [];
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
    this.eventos = await this.eventoService.listarTodos();
    this.carregando = false;
  }

  // Bloqueia a exclusão se o evento ainda estiver em uso; caso contrário
  // pergunta antes de excluir. A exclusão é lógica (marca ativo = 0), então o
  // registro apenas some da lista.
  async excluir(evento: Evento): Promise<void> {
    if (evento.id === undefined) {
      return;
    }

    const usos = await this.eventoService.descreverUsos(evento.id);
    if (usos) {
      await this.confirmacao.avisar(
        'Não é possível excluir',
        `O evento "${evento.nome}" está sendo usado por ${usos}. ` +
          'Troque ou exclua esses registros antes de excluí-lo.'
      );
      return;
    }

    const confirmado = await this.confirmacao.confirmarExclusao(`o evento "${evento.nome}"`);
    if (!confirmado) {
      return;
    }

    await this.eventoService.excluir(evento.id);
    await this.carregar();
  }
}
