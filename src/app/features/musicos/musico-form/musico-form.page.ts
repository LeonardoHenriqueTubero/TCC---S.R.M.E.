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
  IonLabel,
  IonInput,
  IonToggle,
  IonButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { MusicoService } from '../../../core/services/musico.service';
import { CasaOracaoService } from '../../../core/services/casa-oracao.service';
import { InstrumentoService } from '../../../core/services/instrumento.service';
import { CasaOracao } from '../../../core/models/casa-oracao.model';
import { Instrumento } from '../../../core/models/instrumento.model';

@Component({
  selector: 'app-musico-form',
  templateUrl: './musico-form.page.html',
  styleUrls: ['./musico-form.page.scss'],
  imports: [
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
    IonLabel,
    IonInput,
    IonToggle,
    IonButton,
    IonSelect,
    IonSelectOption,
  ],
})
export class MusicoFormPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly musicoService = inject(MusicoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Opções dos dropdowns — carregadas do banco, só o que já está cadastrado.
  casas: CasaOracao[] = [];
  instrumentos: Instrumento[] = [];

  modoEdicao = false;
  private musicoId?: number;

  form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    oficializado: [''],
    batizado: [''],
    cargo: ['', Validators.required],
    ativo: [true],
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

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.modoEdicao = true;
      this.musicoId = Number(idParam);

      // TODO (exercício): carregar o músico existente e preencher o formulário.
      // Mesmo padrão do salvar() abaixo, só que buscando os dados:
      //   const musico = await this.musicoService.buscarPorId(this.musicoId);
      //   if (musico) this.form.patchValue(musico);
      // Repare que patchValue aceita objeto parcial, então dá pra passar o
      // Musico inteiro mesmo ele tendo o campo "id" que o form não possui.
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    if (this.modoEdicao && this.musicoId !== undefined) {
      // TODO (exercício): chamar musicoService.atualizar({ id: this.musicoId, ...valores })
      return;
    }

    await this.musicoService.criar(valores);
    this.router.navigateByUrl('/tabs/musicos');
  }
}
