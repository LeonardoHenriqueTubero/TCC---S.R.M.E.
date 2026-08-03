import { Component, inject } from '@angular/core';
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
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { MusicoService } from '../../../core/services/musico.service';
import { Musico } from '../../../core/models/musico.model';
import { ConfirmacaoService } from '../../../shared/services/confirmacao.service';

addIcons({ addOutline, createOutline, trashOutline });

@Component({
  selector: 'app-musico-lista',
  templateUrl: './musico-lista.page.html',
  styleUrls: ['./musico-lista.page.scss'],
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
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
  ],
})
export class MusicoListaPage implements ViewWillEnter {
  private readonly musicoService = inject(MusicoService);
  private readonly confirmacao = inject(ConfirmacaoService);

  musicos: Musico[] = [];
  carregando = true;

  // ionViewWillEnter (não ngOnInit) porque essa página precisa recarregar a
  // lista toda vez que o usuário volta pra ela (ex: depois de criar/editar um
  // músico), não só na primeira vez que o componente é construído.
  ionViewWillEnter(): void {
    this.carregarMusicos();
  }

  async carregarMusicos(): Promise<void> {
    this.carregando = true;
    this.musicos = await this.musicoService.listarTodos();
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
