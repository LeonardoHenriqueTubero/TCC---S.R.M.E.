import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'musicos',
        loadComponent: () =>
          import('./features/musicos/musico-lista/musico-lista.page').then((m) => m.MusicoListaPage),
      },
      {
        path: 'casas',
        loadComponent: () =>
          import('./features/casas-oracao/casa-oracao.page').then((m) => m.CasaOracaoPage),
      },
      {
        path: 'eventos',
        loadComponent: () => import('./features/eventos/evento.page').then((m) => m.EventoPage),
      },
      {
        path: 'instrumentos',
        loadComponent: () =>
          import('./features/instrumentos/instrumento.page').then((m) => m.InstrumentoPage),
      },
      {
        path: 'lancamentos',
        loadComponent: () =>
          import('./features/lancamentos/lancamento.page').then((m) => m.LancamentoPage),
      },
      {
        path: '',
        redirectTo: 'musicos',
        pathMatch: 'full',
      },
    ],
  },
  // Formulário de músico fica fora das abas: ele é empurrado por cima (tela
  // cheia, com botão de voltar) em vez de virar uma aba.
  {
    path: 'musicos/novo',
    loadComponent: () =>
      import('./features/musicos/musico-form/musico-form.page').then((m) => m.MusicoFormPage),
  },
  {
    path: 'musicos/:id/editar',
    loadComponent: () =>
      import('./features/musicos/musico-form/musico-form.page').then((m) => m.MusicoFormPage),
  },
  {
    path: 'instrumentos/novo',
    loadComponent: () =>
      import('./features/instrumentos/instrumento-form.page').then((m) => m.InstrumentoFormPage),
  },
  {
    path: 'casas/novo',
    loadComponent: () =>
      import('./features/casas-oracao/casa-oracao-form.page').then((m) => m.CasaOracaoFormPage),
  },
  {
    path: 'eventos/novo',
    loadComponent: () => import('./features/eventos/evento-form.page').then((m) => m.EventoFormPage),
  },
  {
    path: 'lancamentos/novo',
    loadComponent: () =>
      import('./features/lancamentos/lancamento-form.page').then((m) => m.LancamentoFormPage),
  },
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
];
