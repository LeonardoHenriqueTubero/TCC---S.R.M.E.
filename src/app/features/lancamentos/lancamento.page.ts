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
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { LancamentoService } from '../../core/services/lancamento.service';
import { LancamentoComMusicos } from '../../core/models/lancamento-musico.model';

addIcons({ addOutline });

@Component({
  selector: 'app-lancamento',
  templateUrl: './lancamento.page.html',
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
  ],
})
export class LancamentoPage implements ViewWillEnter {
  private readonly lancamentoService = inject(LancamentoService);

  lancamentos: LancamentoComMusicos[] = [];
  carregando = true;

  ionViewWillEnter(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.lancamentos = await this.lancamentoService.listarComMusicos();
    this.carregando = false;
  }

  // Converte a data guardada como 'YYYY-MM-DD' para o formato brasileiro DD/MM/YYYY.
  formatarData(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
