import { Component } from '@angular/core';
import { IonButtons, IonMenuButton } from '@ionic/angular/standalone';

/**
 * As três barrinhas que abrem o menu lateral no celular.
 *
 * Só existe no formato de celular. No computador a barra lateral já está
 * sempre à vista, com as mesmas entradas, então um botão para abri-la não
 * teria o que fazer — quem o esconde é o `srme-desktop` no global.scss.
 *
 * Vai na barra de título assim:
 *   <app-menu-botao slot="start"></app-menu-botao>
 */
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
