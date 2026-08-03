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
  IonButton,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { InstrumentoService } from '../../core/services/instrumento.service';
import { Instrumento } from '../../core/models/instrumento.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({ addOutline, createOutline, trashOutline });

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
    IonButton,
  ],
})
export class InstrumentoPage implements ViewWillEnter {
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly confirmacao = inject(ConfirmacaoService);

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

  // Bloqueia a exclusão se o instrumento ainda estiver em uso; caso contrário
  // pergunta antes de excluir. A exclusão é lógica (marca ativo = 0), então o
  // registro apenas some da lista.
  async excluir(instrumento: Instrumento): Promise<void> {
    if (instrumento.id === undefined) {
      return;
    }

    const usos = await this.instrumentoService.descreverUsos(instrumento.id);
    if (usos) {
      await this.confirmacao.avisar(
        'Não é possível excluir',
        `O instrumento "${instrumento.nome}" está sendo usado por ${usos}. ` +
          'Troque ou exclua esses registros antes de excluí-lo.'
      );
      return;
    }

    const confirmado = await this.confirmacao.confirmarExclusao(
      `o instrumento "${instrumento.nome}"`
    );
    if (!confirmado) {
      return;
    }

    await this.instrumentoService.excluir(instrumento.id);
    await this.carregar();
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
