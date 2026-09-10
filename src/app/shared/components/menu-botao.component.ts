import { Component } from '@angular/core';
import { IonButtons, IonMenuButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu-botao',
  imports: [IonButtons, IonMenuButton],
  template: `
    <ion-buttons>
      <ion-menu-button></ion-menu-button>
    </ion-buttons>
  `,
})
export class MenuBotaoComponent {}
