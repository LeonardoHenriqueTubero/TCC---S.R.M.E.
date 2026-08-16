import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { Database } from '../../core/database/database';
import { PainelService, ResumoPainel } from '../../core/services/painel.service';
import { BotaoTemaComponent } from '../../shared/components/botao-tema.component';
import { MenuBotaoComponent } from '../../shared/components/menu-botao.component';

addIcons({
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
  sparklesOutline,
});

@Component({
  selector: 'app-painel',
  templateUrl: './painel.page.html',
  styleUrls: ['./painel.page.scss'],
  imports: [
    RouterLink,
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
export class PainelPage {
  private readonly painelService = inject(PainelService);
  private readonly database = inject(Database);

  resumo: ResumoPainel | null = null;
  carregando = true;

  constructor() {
    // Recarrega sozinho a cada gravação no banco, como as listagens: o painel
    // é a primeira aba e ficaria desatualizado logo depois do primeiro
    // cadastro, já que o Ionic mantém as páginas de aba vivas.
    effect(() => {
      this.database.versaoDados();
      this.carregar();
    });
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.resumo = await this.painelService.carregar();
    this.carregando = false;
  }

  /** Nada cadastrado ainda — nem sequer uma casa de oração. */
  get vazio(): boolean {
    const r = this.resumo;
    return (
      !!r && r.musicos + r.casas + r.eventos + r.instrumentos + r.lancamentos === 0
    );
  }

  numeros(): { rotulo: string; valor: number; icone: string; rota: string }[] {
    const r = this.resumo;
    if (!r) {
      return [];
    }
    return [
      { rotulo: 'Músicos', valor: r.musicos, icone: 'people-outline', rota: '/tabs/musicos' },
      { rotulo: 'Casas', valor: r.casas, icone: 'business-outline', rota: '/tabs/casas' },
      { rotulo: 'Eventos', valor: r.eventos, icone: 'calendar-outline', rota: '/tabs/eventos' },
      {
        rotulo: 'Instrumentos',
        valor: r.instrumentos,
        icone: 'musical-notes-outline',
        rota: '/tabs/instrumentos',
      },
      {
        rotulo: 'Lançamentos',
        valor: r.lancamentos,
        icone: 'clipboard-outline',
        rota: '/tabs/lancamentos',
      },
    ];
  }

  maiorFamilia(): number {
    return Math.max(...(this.resumo?.porFamilia ?? []).map((f) => f.total), 1);
  }

  maiorCasa(): number {
    return Math.max(...(this.resumo?.porCasa ?? []).map((c) => c.total), 1);
  }

  /**
   * A largura da barra, em porcentagem da maior. Um piso de 2% para o valor
   * zero não existir como barra invisível: a casa sem músicos precisa mostrar
   * que está ali, e o número ao lado diz que é zero.
   */
  largura(valor: number, maior: number): number {
    return valor === 0 ? 2 : Math.max((valor / maior) * 100, 6);
  }

  /** 'YYYY-MM-DD' vira 'DD/MM'. O ano fica de fora: são os cinco últimos. */
  formatarData(data: string): string {
    const [, mes, dia] = data.split('-');
    return `${dia}/${mes}`;
  }
}
