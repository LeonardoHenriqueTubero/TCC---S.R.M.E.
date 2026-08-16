import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
  documentTextOutline,
  saveOutline,
} from 'ionicons/icons';

addIcons({
  gridOutline,
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
  documentTextOutline,
  saveOutline,
});

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {}
