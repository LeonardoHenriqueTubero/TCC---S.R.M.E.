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
  IonSearchbar,
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

@Component({
  selector: 'app-lancamento-form',
  templateUrl: './lancamento-form.page.html',
  styleUrls: ['./lancamento-form.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    IonList,
    IonListHeader,
    IonLabel,
    IonCheckbox,
    IonNote,
    IonButton,
  ],
})
export class LancamentoFormPage implements OnInit {
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

  // Texto digitado na busca e ids dos músicos marcados para este lançamento.
  termoBusca = '';
  musicosSelecionados: number[] = [];

  modoEdicao = false;
  private lancamentoId?: number;

  form = this.formBuilder.nonNullable.group({
    data: ['', Validators.required],
    // 0 = nada escolhido; min(1) segura o formulário até selecionar de verdade.
    local: [0, [Validators.required, Validators.min(1)]],
    evento: [0, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit(): Promise<void> {
    this.casas = await this.casaOracaoService.listarTodos();
    this.eventos = await this.eventoService.listarTodos();
    this.musicos = await this.musicoService.listarTodos();

    // A mesma página atende /lancamentos/novo e /lancamentos/:id/editar.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.lancamentoId = Number(idParam);

    const lancamento = await this.lancamentoService.buscarPorId(this.lancamentoId);
    if (lancamento) {
      this.form.patchValue(lancamento);
      // Remarca os checkboxes dos músicos que já estavam no lançamento.
      this.musicosSelecionados = await this.lancamentoService.listarMusicoIds(this.lancamentoId);
    }
  }

  // Filtra a lista de músicos pelo texto da busca (ignora maiúsculas/acentos simples).
  musicosFiltrados(): Musico[] {
    const termo = this.termoBusca.trim().toLowerCase();
    if (!termo) {
      return this.musicos;
    }
    return this.musicos.filter((m) => m.nome.toLowerCase().includes(termo));
  }

  estaSelecionado(id: number | undefined): boolean {
    return id !== undefined && this.musicosSelecionados.includes(id);
  }

  // Marca/desmarca um músico na lista de participantes do lançamento.
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

  async salvar(): Promise<void> {
    // Precisa de formulário válido e pelo menos um músico selecionado.
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
