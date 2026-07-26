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
  IonNote,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonIcon,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { CasaOracao } from '../../core/models/casa-oracao.model';

addIcons({ addOutline });

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
  ],
})
export class CasaOracaoPage implements ViewWillEnter {
  private readonly casaOracaoService = inject(CasaOracaoService);

  casas: CasaOracao[] = [];
  carregando = true;

  ionViewWillEnter(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.casas = await this.casaOracaoService.listarTodos();
    this.carregando = false;
  }
}
