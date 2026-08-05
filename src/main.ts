import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAppInitializer, inject } from '@angular/core';
import { defineCustomElements as jeepSqliteElements } from 'jeep-sqlite/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { Database } from './app/core/database/database';
import { TemaService } from './app/core/services/tema.service';

jeepSqliteElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // O tema é aplicado antes das telas aparecerem, senão o app pisca claro
    // por um instante para quem escolheu o escuro.
    provideAppInitializer(() => inject(TemaService).iniciar()),
    provideAppInitializer(() => inject(Database).iniciar()),
  ],
});
