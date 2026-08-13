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
} from '@ionic/angular/standalone';
import { EventoService } from '../../core/services/evento.service';
import { FaltaPreencherComponent } from '../../shared/components/falta-preencher.component';
import { TAMANHO_MAXIMO } from '../../core/limites';

@Component({
  selector: 'app-evento-form',
  templateUrl: './evento-form.page.html',
  imports: [
    FaltaPreencherComponent,
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
  ],
})
export class EventoFormPage implements OnInit {
  protected readonly TAMANHO_MAXIMO = TAMANHO_MAXIMO;
  protected readonly ROTULOS = { nome: 'Nome' };

  private readonly formBuilder = inject(FormBuilder);
  private readonly eventoService = inject(EventoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  modoEdicao = false;
  private eventoId?: number;

  form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.nome)]],
  });

  async ngOnInit(): Promise<void> {
    // A mesma página atende /eventos/novo e /eventos/:id/editar. Quando existe
    // o parâmetro :id, buscamos o registro e preenchemos o formulário com ele.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.eventoId = Number(idParam);

    const evento = await this.eventoService.buscarPorId(this.eventoId);
    if (evento) {
      this.form.patchValue(evento);
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    if (this.modoEdicao && this.eventoId !== undefined) {
      await this.eventoService.atualizar(this.eventoId, valores);
    } else {
      await this.eventoService.criar(valores);
    }

    this.router.navigateByUrl('/tabs/eventos');
  }
}
