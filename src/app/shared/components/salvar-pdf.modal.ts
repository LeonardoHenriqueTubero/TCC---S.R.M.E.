import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonList,
  IonListHeader,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonNote,
  ModalController,
} from '@ionic/angular/standalone';

/** Pastas que o app oferece. Os nomes batem com as chaves aceitas pelo
 *  processo principal do Electron, que as traduz para o caminho real. */
export type PastaDestino = 'downloads' | 'documents' | 'desktop';

/** O que o modal devolve quando o usuário confirma. */
export interface DestinoEscolhido {
  pasta: PastaDestino;
  /** Já com a extensão .pdf. */
  nomeArquivo: string;
}

/**
 * Pergunta onde salvar o PDF, no lugar do "Salvar como" do sistema.
 *
 * O diálogo nativo do Electron no Linux não fica preso à janela do app e trava
 * o programa (ver o comentário no preload.ts do Electron), então a escolha é
 * feita aqui dentro, onde o comportamento é previsível em qualquer sistema.
 */
@Component({
  selector: 'app-salvar-pdf',
  templateUrl: './salvar-pdf.modal.html',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonInput,
    IonList,
    IonListHeader,
    IonLabel,
    IonRadio,
    IonRadioGroup,
    IonNote,
  ],
})
export class SalvarPdfModal {
  /** Nome sugerido, sem a extensão. */
  @Input() nomeSugerido = 'relatorio';

  nome = '';
  pasta: PastaDestino = 'downloads';

  readonly pastas: { valor: PastaDestino; rotulo: string }[] = [
    { valor: 'downloads', rotulo: 'Downloads' },
    { valor: 'documents', rotulo: 'Documentos' },
    { valor: 'desktop', rotulo: 'Área de Trabalho' },
  ];

  constructor(private readonly modalController: ModalController) {}

  ngOnInit(): void {
    this.nome = this.nomeSugerido;
  }

  get nomeInvalido(): boolean {
    return this.nome.trim().length === 0;
  }

  cancelar(): void {
    this.modalController.dismiss(null, 'cancelar');
  }

  salvar(): void {
    if (this.nomeInvalido) {
      return;
    }

    const destino: DestinoEscolhido = {
      pasta: this.pasta,
      nomeArquivo: `${this.nome.trim()}.pdf`,
    };

    this.modalController.dismiss(destino, 'salvar');
  }
}
