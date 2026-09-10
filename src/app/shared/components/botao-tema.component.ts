import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { TemaService } from '../../core/services/tema.service';

addIcons({ moonOutline, sunnyOutline });

@Component({
  selector: 'app-botao-tema',
  imports: [IonButton, IonIcon],
  template: `
    <ion-button
      fill="clear"
      (click)="tema.alternar()"
      [attr.aria-label]="tema.escuro() ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'"
      [title]="tema.escuro() ? 'Tema claro' : 'Tema escuro'"
    >
      <ion-icon slot="icon-only" [name]="tema.escuro() ? 'sunny-outline' : 'moon-outline'"></ion-icon>
    </ion-button>
  `,
})
export class BotaoTemaComponent {
  protected readonly tema = inject(TemaService);
}
