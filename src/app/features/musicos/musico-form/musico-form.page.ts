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
import { FaltaPreencherComponent } from '../../../shared/components/falta-preencher.component';
import { TAMANHO_MAXIMO } from '../../../core/limites';

@Component({
  selector: 'app-musico-form',
  templateUrl: './musico-form.page.html',
  styleUrls: ['./musico-form.page.scss'],
  imports: [
    FaltaPreencherComponent,
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
  protected readonly ROTULOS = {
    nome: 'Nome',
    cargo: 'Cargo',
    oficializado: 'Oficializado',
    batizado: 'Batizado',
    comum_congregacao: 'Casa de oração',
    instrumento: 'Instrumento',
  };

  private readonly formBuilder = inject(FormBuilder);
  private readonly musicoService = inject(MusicoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  casas: CasaOracao[] = [];
  instrumentos: Instrumento[] = [];

  readonly SIM_OU_NAO = ['Sim', 'Não'] as const;

  modoEdicao = false;
  private musicoId?: number;

  form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.nome)]],
    oficializado: ['', Validators.required],
    batizado: ['', Validators.required],
    cargo: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.cargo)]],
    comum_congregacao: [0, [Validators.required, Validators.min(1)]],
    instrumento: [0, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    this.casas = await this.casaOracaoService.listarTodos();
    this.instrumentos = await this.instrumentoService.listarTodos();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.musicoId = Number(idParam);

    const musico = await this.musicoService.buscarPorId(this.musicoId);
    if (musico) {
      this.form.patchValue({
        ...musico,
        oficializado: this.simOuNao(musico.oficializado),
        batizado: this.simOuNao(musico.batizado),
      });
    }
  }

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
