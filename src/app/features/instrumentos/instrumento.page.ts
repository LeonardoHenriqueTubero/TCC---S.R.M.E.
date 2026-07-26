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
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonIcon,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { InstrumentoService } from '../../core/services/instrumento.service';
import { Instrumento } from '../../core/models/instrumento.model';

addIcons({ addOutline });

interface GrupoInstrumentos {
  familia: string;
  instrumentos: Instrumento[];
}

@Component({
  selector: 'app-instrumento',
  templateUrl: './instrumento.page.html',
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
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonIcon,
  ],
})
export class InstrumentoPage implements ViewWillEnter {
  private readonly instrumentoService = inject(InstrumentoService);

  grupos: GrupoInstrumentos[] = [];
  carregando = true;

  ionViewWillEnter(): void {
    this.carregar();
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    const instrumentos = await this.instrumentoService.listarTodos();
    this.grupos = this.agruparPorFamilia(instrumentos);
    this.carregando = false;
  }

  // Transforma a lista plana em grupos por família. O service já devolve
  // ordenado por família, então instrumentos da mesma família vêm em sequência.
  private agruparPorFamilia(instrumentos: Instrumento[]): GrupoInstrumentos[] {
    const grupos: GrupoInstrumentos[] = [];

    for (const instrumento of instrumentos) {
      let grupo = grupos.find((g) => g.familia === instrumento.familia);
      if (!grupo) {
        grupo = { familia: instrumento.familia, instrumentos: [] };
        grupos.push(grupo);
      }
      grupo.instrumentos.push(instrumento);
    }

    return grupos;
  }
}
