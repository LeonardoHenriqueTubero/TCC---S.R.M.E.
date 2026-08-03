import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';

/**
 * Pop-up de confirmação compartilhado por todas as telas.
 *
 * Uso típico antes de uma exclusão:
 *   if (await this.confirmacao.confirmarExclusao('o músico João')) { ... }
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmacaoService {
  private readonly alertController = inject(AlertController);

  // Abre o alerta e resolve como true apenas se o usuário tocar em "Excluir".
  // Cancelar ou fechar pelo fundo resolve como false.
  async confirmarExclusao(descricao: string): Promise<boolean> {
    return this.confirmar({
      cabecalho: 'Confirmar exclusão',
      mensagem: `Tem certeza que deseja excluir ${descricao}?`,
      textoConfirmar: 'Excluir',
      perigoso: true,
    });
  }

  // Aviso simples, só com "OK" — usado quando a ação não pode ser concluída
  // (por exemplo, tentar excluir um registro que ainda está em uso).
  async avisar(cabecalho: string, mensagem: string): Promise<void> {
    const alerta = await this.alertController.create({
      header: cabecalho,
      message: mensagem,
      buttons: ['OK'],
    });

    await alerta.present();
    await alerta.onDidDismiss();
  }

  // Versão genérica, caso alguma tela precise de uma confirmação diferente.
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
