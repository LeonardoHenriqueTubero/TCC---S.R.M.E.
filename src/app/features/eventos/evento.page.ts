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
  IonSpinner,
  IonFab,
  IonFabButton,
  IonIcon,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { EventoService } from '../../core/services/evento.service';
import { Evento } from '../../core/models/evento.model';

addIcons({ addOutline });

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
  ],
})
export class EventoPage implements ViewWillEnter {
  private readonly eventoService = inject(EventoService);

  eventos: Evento[] = [];
  carregando = true;

  ionViewWillEnter(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.eventos = await this.eventoService.listarTodos();
    this.carregando = false;
  }
}
