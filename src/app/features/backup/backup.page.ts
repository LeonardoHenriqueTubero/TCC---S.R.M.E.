import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  downloadOutline,
  documentAttachOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { BackupService, ErroDeBackup } from '../../core/services/backup.service';
import { listaEmPortugues } from '../../core/texto';
import { BotaoTemaComponent } from '../../shared/components/botao-tema.component';
import { MenuBotaoComponent } from '../../shared/components/menu-botao.component';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';

addIcons({
  downloadOutline,
  documentAttachOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
});

interface Recado {
  tipo: 'ok' | 'erro';
  texto: string;
}

@Component({
  selector: 'app-backup',
  templateUrl: './backup.page.html',
  styleUrls: ['./backup.page.scss'],
  imports: [
    BotaoTemaComponent,
    MenuBotaoComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonSpinner,
  ],
})
export class BackupPage {
  private readonly backup = inject(BackupService);
  private readonly confirmacao = inject(ConfirmacaoService);

  exportando = false;
  importando = false;
  recado: Recado | null = null;

  async exportar(): Promise<void> {
    this.exportando = true;
    this.recado = null;

    try {
      const nome = await this.backup.exportar();
      this.recado = { tipo: 'ok', texto: `Backup gerado: ${nome}` };
    } catch (erro) {
      this.recado = { tipo: 'erro', texto: this.mensagem(erro) };
    } finally {
      this.exportando = false;
    }
  }

  async aoEscolherArquivo(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];

    entrada.value = '';

    if (!arquivo) {
      return;
    }

    this.importando = true;
    this.recado = null;

    try {
      const conteudo = await this.backup.ler(arquivo);

      const confirmado = await this.confirmacao.confirmar({
        cabecalho: 'Substituir todos os dados?',
        mensagem:
          `O arquivo tem ${this.descrever(conteudo.resumo)}. ` +
          'Tudo o que está cadastrado agora será apagado e substituído por este backup. ' +
          'Não dá para desfazer.',
        textoConfirmar: 'Substituir',
        perigoso: true,
      });

      if (!confirmado) {
        this.recado = null;
        return;
      }

      await this.backup.restaurar(conteudo);
      this.recado = {
        tipo: 'ok',
        texto: `Dados restaurados: ${this.descrever(conteudo.resumo)}.`,
      };
    } catch (erro) {
      this.recado = { tipo: 'erro', texto: this.mensagem(erro) };
    } finally {
      this.importando = false;
    }
  }

  private descrever(resumo: { rotulo: string; total: number }[]): string {
    const cheias = resumo.filter((item) => item.total > 0);

    if (cheias.length === 0) {
      return 'nenhum registro';
    }

    return listaEmPortugues(cheias.map((item) => `${item.total} ${item.rotulo}`));
  }

  private mensagem(erro: unknown): string {
    if (erro instanceof ErroDeBackup) {
      return erro.message;
    }
    return `Algo deu errado: ${erro instanceof Error ? erro.message : erro}`;
  }
}
