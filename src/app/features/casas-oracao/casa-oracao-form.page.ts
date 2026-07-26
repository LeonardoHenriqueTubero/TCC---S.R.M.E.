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
import { CasaOracaoService } from '../../core/services/casa-oracao.service';

@Component({
  selector: 'app-casa-oracao-form',
  templateUrl: './casa-oracao-form.page.html',
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
export class CasaOracaoFormPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly router = inject(Router);

  form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    cidade: ['', Validators.required],
  });

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    await this.casaOracaoService.criar(this.form.getRawValue());
    this.router.navigateByUrl('/tabs/casas');
  }
}
