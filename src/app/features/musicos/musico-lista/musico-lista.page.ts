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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline } from 'ionicons/icons';
import { MusicoService } from '../../../core/services/musico.service';
import { Musico } from '../../../core/models/musico.model';

addIcons({ addOutline, trashOutline });

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
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
  ],
})
export class MusicoListaPage implements ViewWillEnter {
  private readonly musicoService = inject(MusicoService);

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

  async excluir(musico: Musico): Promise<void> {
    if (musico.id === undefined) {
      return;
    }

    await this.musicoService.excluir(musico.id);
    await this.carregarMusicos();
  }
}
