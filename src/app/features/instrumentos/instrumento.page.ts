import { Component, effect, inject } from '@angular/core';
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
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { Database } from '../../core/database/database';
import { InstrumentoService } from '../../core/services/instrumento.service';
import { Instrumento } from '../../core/models/instrumento.model';
import { ConfirmacaoService } from '../../shared/services/confirmacao.service';
import { BotaoTemaComponent } from '../../shared/components/botao-tema.component';
import { MenuBotaoComponent } from '../../shared/components/menu-botao.component';
import { BarraBuscaComponent } from '../../shared/components/barra-busca.component';
import { contemTermo } from '../../core/texto';

addIcons({ addOutline, createOutline, trashOutline });

interface GrupoInstrumentos {
  familia: string;
  instrumentos: Instrumento[];
}

@Component({
  selector: 'app-instrumento',
  templateUrl: './instrumento.page.html',
  imports: [
    BarraBuscaComponent,
    BotaoTemaComponent,
    MenuBotaoComponent,
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
    IonButtons,
    IonButton,
  ],
})
export class InstrumentoPage {
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly database = inject(Database);

  // A lista plana e a fonte, e os grupos passam a ser calculados: com a busca,
  // o agrupamento muda a cada tecla, e reagrupar o que ja veio do banco e mais
  // simples do que filtrar dentro de grupos ja montados.
  instrumentos: Instrumento[] = [];
  carregando = true;

  termoBusca = '';

  constructor() {
    // Carrega na criação da tela e recarrega sozinha sempre que algo é gravado
    // no banco (criar/editar/excluir, aqui ou em outra tela). Sem isso a lista
    // ficaria desatualizada até recarregar a página, porque o Ionic mantém as
    // páginas de aba vivas e o ionViewWillEnter não dispara de novo.
    effect(() => {
      this.database.versaoDados();
      this.carregar();
    });
  }

  async carregar(): Promise<void> {
    this.carregando = true;
    this.instrumentos = await this.instrumentoService.listarTodos();
    this.carregando = false;
  }

  // A familia entra na busca junto com o nome: procurar "metais" traz o grupo
  // inteiro, que e como se pensa a orquestra. Familia sem nenhum instrumento
  // encontrado nao aparece, senao a tela ficaria cheia de cabecalhos vazios.
  gruposFiltrados(): GrupoInstrumentos[] {
    const encontrados = this.instrumentos.filter((instrumento) =>
      contemTermo(this.termoBusca, instrumento.nome, instrumento.familia)
    );
    return this.agruparPorFamilia(encontrados);
  }

  // Para a contagem da barra de busca: quantos instrumentos sobraram, e não
  // quantas famílias.
  instrumentosEncontrados(): number {
    return this.gruposFiltrados().reduce((total, grupo) => total + grupo.instrumentos.length, 0);
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
