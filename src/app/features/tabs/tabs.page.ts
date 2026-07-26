import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  businessOutline,
  calendarOutline,
  musicalNotesOutline,
  clipboardOutline,
} from 'ionicons/icons';

addIcons({ peopleOutline, businessOutline, calendarOutline, musicalNotesOutline, clipboardOutline });

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {}
