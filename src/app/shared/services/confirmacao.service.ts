import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class ConfirmacaoService {
  private readonly alertController = inject(AlertController);

  async confirmarExclusao(descricao: string): Promise<boolean> {
    return this.confirmar({
      cabecalho: 'Confirmar exclusão',
      mensagem: `Tem certeza que deseja excluir ${descricao}?`,
      textoConfirmar: 'Excluir',
      perigoso: true,
    });
  }

  async avisar(cabecalho: string, mensagem: string): Promise<void> {
    const alerta = await this.alertController.create({
      header: cabecalho,
      message: mensagem,
      buttons: ['OK'],
    });

    await alerta.present();
    await alerta.onDidDismiss();
  }

  async confirmar(opcoes: {
    cabecalho: string;
    mensagem: string;
    textoConfirmar?: string;
    textoCancelar?: string;
    perigoso?: boolean;
  }): Promise<boolean> {
    const alerta = await this.alertController.create({
      header: opcoes.cabecalho,
      message: opcoes.mensagem,
      buttons: [
        {
          text: opcoes.textoCancelar ?? 'Cancelar',
          role: 'cancel',
        },
        {
          text: opcoes.textoConfirmar ?? 'Confirmar',
          role: 'confirmar',
          cssClass: opcoes.perigoso ? 'alerta-perigo' : undefined,
        },
      ],
    });

    await alerta.present();

    const { role } = await alerta.onDidDismiss();
    return role === 'confirmar';
  }
}
