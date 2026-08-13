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
  IonButton,
} from '@ionic/angular/standalone';
import { InstrumentoService } from '../../core/services/instrumento.service';
import { FaltaPreencherComponent } from '../../shared/components/falta-preencher.component';
import { SelecaoAdaptavelDirective } from '../../shared/directives/selecao-adaptavel.directive';
import { TAMANHO_MAXIMO } from '../../core/limites';

@Component({
  selector: 'app-instrumento-form',
  templateUrl: './instrumento-form.page.html',
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
    IonSelect,
    IonSelectOption,
    IonButton,
  ],
})
export class InstrumentoFormPage implements OnInit {
  protected readonly TAMANHO_MAXIMO = TAMANHO_MAXIMO;
  // Na ordem dos campos na tela (ver falta-preencher.component.ts).
  protected readonly ROTULOS = { nome: 'Nome', familia: 'Família' };

  private readonly formBuilder = inject(FormBuilder);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // As famílias são fixas (as mesmas usadas no seed), então ficam direto aqui.
  readonly familias = ['Cordas', 'Madeiras', 'Metais', 'Teclas'];

  modoEdicao = false;
  private instrumentoId?: number;

  form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.nomeInstrumento)]],
    familia: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    // A mesma página atende /instrumentos/novo e /instrumentos/:id/editar.
    // Com o parâmetro :id, buscamos o registro e preenchemos o formulário.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.instrumentoId = Number(idParam);

    const instrumento = await this.instrumentoService.buscarPorId(this.instrumentoId);
    if (instrumento) {
      this.form.patchValue(instrumento);
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    if (this.modoEdicao && this.instrumentoId !== undefined) {
      await this.instrumentoService.atualizar(this.instrumentoId, valores);
    } else {
      await this.instrumentoService.criar(valores);
    }

    this.router.navigateByUrl('/tabs/instrumentos');
  }
}
