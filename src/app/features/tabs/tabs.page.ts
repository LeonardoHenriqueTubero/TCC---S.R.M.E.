import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
  documentTextOutline,
} from 'ionicons/icons';

addIcons({
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
  documentTextOutline,
});

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {}
