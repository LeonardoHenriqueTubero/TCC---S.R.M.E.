import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { LancamentoService } from '../../core/services/lancamento.service';
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { EventoService } from '../../core/services/evento.service';
import { MusicoService } from '../../core/services/musico.service';
import { CasaOracao } from '../../core/models/casa-oracao.model';
import { Evento } from '../../core/models/evento.model';
import { Musico } from '../../core/models/musico.model';

@Component({
  selector: 'app-lancamento-form',
  templateUrl: './lancamento-form.page.html',
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
export class LancamentoFormPage implements ViewWillEnter {
  private readonly formBuilder = inject(FormBuilder);
  private readonly lancamentoService = inject(LancamentoService);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly eventoService = inject(EventoService);
  private readonly musicoService = inject(MusicoService);
  private readonly router = inject(Router);

  casas: CasaOracao[] = [];
  eventos: Evento[] = [];
  musicos: Musico[] = [];

  // Texto digitado na busca e ids dos músicos marcados para este lançamento.
  termoBusca = '';
  musicosSelecionados: number[] = [];

  form = this.formBuilder.nonNullable.group({
    data: ['', Validators.required],
    // 0 = nada escolhido; min(1) segura o formulário até selecionar de verdade.
    local: [0, [Validators.required, Validators.min(1)]],
    evento: [0, [Validators.required, Validators.min(1)]],
  });

  async ionViewWillEnter(): Promise<void> {
    this.casas = await this.casaOracaoService.listarTodos();
    this.eventos = await this.eventoService.listarTodos();
    this.musicos = await this.musicoService.listarTodos();
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

    await this.lancamentoService.criar(this.form.getRawValue(), this.musicosSelecionados);
    this.router.navigateByUrl('/tabs/lancamentos');
  }
}
