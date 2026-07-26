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
  IonButton,
} from '@ionic/angular/standalone';
import { EventoService } from '../../core/services/evento.service';

@Component({
  selector: 'app-evento-form',
  templateUrl: './evento-form.page.html',
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
    IonButton,
  ],
})
export class EventoFormPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly eventoService = inject(EventoService);
  private readonly router = inject(Router);

  form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
  });

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    await this.eventoService.criar(this.form.getRawValue());
    this.router.navigateByUrl('/tabs/eventos');
  }
}
