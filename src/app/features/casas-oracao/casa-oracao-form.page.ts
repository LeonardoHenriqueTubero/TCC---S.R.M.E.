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
import { CasaOracaoService } from '../../core/services/casa-oracao.service';
import { TAMANHO_MAXIMO } from '../../core/limites';

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
export class CasaOracaoFormPage implements OnInit {
  protected readonly TAMANHO_MAXIMO = TAMANHO_MAXIMO;

  private readonly formBuilder = inject(FormBuilder);
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  modoEdicao = false;
  private casaId?: number;

  form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.nome)]],
    cidade: ['', [Validators.required, Validators.maxLength(TAMANHO_MAXIMO.cidade)]],
  });

  async ngOnInit(): Promise<void> {
    // A mesma página atende /casas/novo e /casas/:id/editar. Quando existe o
    // parâmetro :id, buscamos o registro e preenchemos o formulário com ele.
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.modoEdicao = true;
    this.casaId = Number(idParam);

    const casa = await this.casaOracaoService.buscarPorId(this.casaId);
    if (casa) {
      this.form.patchValue(casa);
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const valores = this.form.getRawValue();

    if (this.modoEdicao && this.casaId !== undefined) {
      await this.casaOracaoService.atualizar(this.casaId, valores);
    } else {
      await this.casaOracaoService.criar(valores);
    }

    this.router.navigateByUrl('/tabs/casas');
  }
}
