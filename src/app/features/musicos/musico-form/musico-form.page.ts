import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { MusicoService } from '../../../core/services/musico.service';
import { CasaOracaoService } from '../../../core/services/casa-oracao.service';
import { InstrumentoService } from '../../../core/services/instrumento.service';
import { CasaOracao } from '../../../core/models/casa-oracao.model';
import { Instrumento } from '../../../core/models/instrumento.model';
import { SelecaoAdaptavelDirective } from '../../../shared/directives/selecao-adaptavel.directive';
import { TAMANHO_MAXIMO } from '../../../core/limites';

@Component({
  selector: 'app-musico-form',
  templateUrl: './musico-form.page.html',
  styleUrls: ['./musico-form.page.scss'],
  imports: [
    SelecaoAdaptavelDirective,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
  ],
})
export class MusicoFormPage implements OnInit {
  protected readonly TAMANHO_MAXIMO = TAMANHO_MAXIMO;

  private readonly formBuilder = inject(FormBuilder);
  private readonly musicoService = inject(MusicoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Opções dos dropdowns — carregadas do banco, só o que já está cadastrado.
  casas: CasaOracao[] = [];
  instrumentos: Instrumento[] = [];

  // As duas únicas respostas de "Oficializado" e "Batizado".
  readonly SIM_OU_NAO = ['Sim', 'Não'] as const;

  modoEdicao = false;
  private musicoId?: number;

  // Não há campo "ativo" aqui: todo músico novo nasce ativo, e a exclusão
  // (que marca ativo = 0) é feita pela lista, não por este formulário.
  form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.nome)]],
    oficializado: ['', Validators.required],
    batizado: ['', Validators.required],
    cargo: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.cargo)]],
    // Começam em 0 (nenhuma opção tem id 0), então o Validators.min(1) mantém
    // o formulário inválido até o usuário escolher uma casa/instrumento reais
    // nos <ion-select>. O valor guardado é o id da casa/instrumento.
    comum_congregacao: [0, [Validators.required, Validators.min(1)]],
    instrumento: [0, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    // Carrega as opções dos dropdowns — apenas o que já está cadastrado no banco.
    this.casas = await this.casaOracaoService.listarTodos();
    this.instrumentos = await this.instrumentoService.listarTodos();

    // A mesma página atende /musicos/novo e /musicos/:id/editar. Com o
    // parâmetro :id, buscamos o registro e preenchemos o formulário.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.musicoId = Number(idParam);

    const musico = await this.musicoService.buscarPorId(this.musicoId);
    if (musico) {
      // patchValue aceita objeto parcial, então dá para passar o Musico inteiro
      // mesmo ele tendo campos (id, ativo) que o formulário não possui.
      this.form.patchValue({
        ...musico,
        oficializado: this.simOuNao(musico.oficializado),
        batizado: this.simOuNao(musico.batizado),
      });
    }
  }

  /**
   * Os dois campos eram de texto livre, então um registro antigo pode trazer
   * "sim", "NÃO", "s"... — e o <ion-select> não mostra um valor que não seja
   * exatamente uma das suas opções. Aqui a resposta antiga é reconhecida pela
   * primeira letra; o que não for nem sim nem não abre em branco, para o
   * usuário escolher.
   */
  private simOuNao(valor: string): string {
    const inicial = valor?.trim().charAt(0).toLowerCase();
    if (inicial === 's') {
      return 'Sim';
    }
    return inicial === 'n' ? 'Não' : '';
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    if (this.modoEdicao && this.musicoId !== undefined) {
      await this.musicoService.atualizar(this.musicoId, valores);
    } else {
      await this.musicoService.criar(valores);
    }

    this.router.navigateByUrl('/tabs/musicos');
  }
}
