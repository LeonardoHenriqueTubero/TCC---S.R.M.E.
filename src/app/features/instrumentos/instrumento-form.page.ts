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
  IonButton,
} from '@ionic/angular/standalone';
import { InstrumentoService } from '../../core/services/instrumento.service';

@Component({
  selector: 'app-instrumento-form',
  templateUrl: './instrumento-form.page.html',
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
    IonButton,
  ],
})
export class InstrumentoFormPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly router = inject(Router);

  // As famílias são fixas (as mesmas usadas no seed), então ficam direto aqui.
  readonly familias = ['Cordas', 'Madeiras', 'Metais'];

  form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    familia: ['', Validators.required],
  });

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    await this.instrumentoService.criar(this.form.getRawValue());
    this.router.navigateByUrl('/tabs/instrumentos');
  }
}
