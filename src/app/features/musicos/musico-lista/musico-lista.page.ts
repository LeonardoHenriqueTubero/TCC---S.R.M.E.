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
  IonButtons,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { Database } from '../../../core/database/database';
import { MusicoService } from '../../../core/services/musico.service';
import { Musico, MusicoListado } from '../../../core/models/musico.model';
import { ConfirmacaoService } from '../../../shared/services/confirmacao.service';
import { BotaoTemaComponent } from '../../../shared/components/botao-tema.component';
import { AvisoPreRequisitosComponent } from '../../../shared/components/aviso-pre-requisitos.component';
import { PreRequisito, PreRequisitosService } from '../../../core/services/pre-requisitos.service';

addIcons({ addOutline, createOutline, trashOutline });

@Component({
  selector: 'app-musico-lista',
  templateUrl: './musico-lista.page.html',
  styleUrls: ['./musico-lista.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
  ],
})
export class MusicoListaPage {
  private readonly musicoService = inject(MusicoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly database = inject(Database);
  private readonly preRequisitos = inject(PreRequisitosService);

  musicos: MusicoListado[] = [];
  // Vazio = dá para cadastrar. Com itens, o botão de novo músico fica
  // desabilitado e a tela explica o que falta.
  faltando: PreRequisito[] = [];
  carregando = true;

  constructor() {
    // Carrega na criação da tela e recarrega sozinha sempre que algo é gravado
    // no banco (criar/editar/excluir, aqui ou em outra tela). Sem isso a lista
    // ficaria desatualizada até recarregar a página, porque o Ionic mantém as
    // páginas de aba vivas e o ionViewWillEnter não dispara de novo.
    effect(() => {
      this.database.versaoDados();
      this.carregarMusicos();
    });
  }

  async carregarMusicos(): Promise<void> {
    this.carregando = true;
    [this.musicos, this.faltando] = await Promise.all([
      this.musicoService.listarComNomes(),
      this.preRequisitos.paraMusico(),
    ]);
    this.carregando = false;
  }

  // Pergunta antes de excluir; a exclusão é lógica (marca ativo = 0), então o
  // registro apenas some da lista.
  async excluir(musico: Musico): Promise<void> {
    if (musico.id === undefined) {
      return;
    }

    const confirmado = await this.confirmacao.confirmarExclusao(`o músico "${musico.nome}"`);
    if (!confirmado) {
      return;
    }

    await this.musicoService.excluir(musico.id);
    await this.carregarMusicos();
  }
}
