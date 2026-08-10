import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAppInitializer, inject } from '@angular/core';
import { defineCustomElements as jeepSqliteElements } from 'jeep-sqlite/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { Database } from './app/core/database/database';
import { FormatoService } from './app/core/services/formato.service';
import { TemaService } from './app/core/services/tema.service';

jeepSqliteElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Formato e tema são aplicados antes das telas aparecerem, senão o app
    // pisca — claro para quem escolheu o escuro, de celular para quem está no
    // computador.
    provideAppInitializer(() => inject(FormatoService).iniciar()),
    provideAppInitializer(() => inject(TemaService).iniciar()),
    provideAppInitializer(() => inject(Database).iniciar()),
  ],
});
