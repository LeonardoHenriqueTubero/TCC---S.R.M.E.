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
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  IonLabel,
  IonCheckbox,
  IonNote,
  IonButton,
} from '@ionic/angular/standalone';
import { LancamentoService } from '../../core/services/lancamento.service';
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { EventoService } from '../../core/services/evento.service';
import { MusicoService } from '../../core/services/musico.service';
import { CasaOracao } from '../../core/models/casa-oracao.model';
import { Evento } from '../../core/models/evento.model';
import { Musico } from '../../core/models/musico.model';
import { SelecaoAdaptavelDirective } from '../../shared/directives/selecao-adaptavel.directive';
import { FaltaPreencherComponent } from '../../shared/components/falta-preencher.component';
import { BarraBuscaComponent } from '../../shared/components/barra-busca.component';
import { contemTermo } from '../../core/texto';
import { comoBrasileiro, dataDentroDoIntervalo, dataMaxima, dataMinima } from '../../core/limites';

@Component({
  selector: 'app-lancamento-form',
  templateUrl: './lancamento-form.page.html',
  styleUrls: ['./lancamento-form.page.scss'],
  imports: [
    BarraBuscaComponent,
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
    IonSelect,
    IonSelectOption,
    IonList,
    IonListHeader,
    IonLabel,
    IonCheckbox,
    IonNote,
    IonButton,
  ],
})
export class LancamentoFormPage implements OnInit {
  protected readonly dataMinima = dataMinima();
  protected readonly dataMaxima = dataMaxima();
  protected readonly intervaloDeDatas =
    `${comoBrasileiro(dataMinima())} e ${comoBrasileiro(dataMaxima())}`;

  protected readonly ROTULOS = {
    data: 'Data',
    local: 'Casa de oração',
    evento: 'Evento',
  };

  private readonly formBuilder = inject(FormBuilder);
  private readonly lancamentoService = inject(LancamentoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly eventoService = inject(EventoService);
  private readonly musicoService = inject(MusicoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  casas: CasaOracao[] = [];
  eventos: Evento[] = [];
  musicos: Musico[] = [];

  termoBusca = '';
  musicosSelecionados: number[] = [];

  modoEdicao = false;
  private lancamentoId?: number;

  form = this.formBuilder.nonNullable.group({
    data: ['', [Validators.required, dataDentroDoIntervalo()]],
    local: [0, [Validators.required, Validators.min(1)]],
    evento: [0, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    this.casas = await this.casaOracaoService.listarTodos();
    this.eventos = await this.eventoService.listarTodos();
    this.musicos = await this.musicoService.listarTodos();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.lancamentoId = Number(idParam);

    const lancamento = await this.lancamentoService.buscarPorId(this.lancamentoId);
    if (lancamento) {
      this.form.patchValue(lancamento);
      this.musicosSelecionados = await this.lancamentoService.listarMusicoIds(this.lancamentoId);
    }
  }

  musicosFiltrados(): Musico[] {
    return this.musicos.filter((musico) => contemTermo(this.termoBusca, musico.nome));
  }

  estaSelecionado(id: number | undefined): boolean {
    return id !== undefined && this.musicosSelecionados.includes(id);
  }

  alternarMusico(id: number | undefined): void {
    if (id === undefined) {
      return;
    }
    if (this.musicosSelecionados.includes(id)) {
      this.musicosSelecionados = this.musicosSelecionados.filter((x) => x !== id);
    } else {
      this.musicosSelecionados = [...this.musicosSelecionados, id];
    }
  }

  protected pendenciasExtras(): string[] {
    return this.musicosSelecionados.length === 0 ? ['pelo menos um músico'] : [];
  }

  async salvar(): Promise<void> {
    if (this.form.invalid || this.musicosSelecionados.length === 0) {
      return;
    }

    const valores = this.form.getRawValue();

    if (this.modoEdicao && this.lancamentoId !== undefined) {
      await this.lancamentoService.atualizar(this.lancamentoId, valores, this.musicosSelecionados);
    } else {
      await this.lancamentoService.criar(valores, this.musicosSelecionados);
    }

    this.router.navigateByUrl('/tabs/lancamentos');
  }
}
