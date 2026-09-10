import { Injectable, inject } from '@angular/core';
import { CasaOracaoService } from './casa-oracao.service';
import { EventoService } from './evento.service';
import { InstrumentoService } from './instrumento.service';
import { MusicoService } from './musico.service';

export interface PreRequisito {
  artigo: string;
  nome: string;
  rota: string;
}

const CASA: PreRequisito = { artigo: 'uma', nome: 'casa de oração', rota: '/tabs/casas' };
const INSTRUMENTO: PreRequisito = { artigo: 'um', nome: 'instrumento', rota: '/tabs/instrumentos' };
const EVENTO: PreRequisito = { artigo: 'um', nome: 'evento', rota: '/tabs/eventos' };
const MUSICO: PreRequisito = { artigo: 'um', nome: 'músico', rota: '/tabs/musicos' };

@Injectable({
  providedIn: 'root',
})
export class PreRequisitosService {
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly eventoService = inject(EventoService);
  private readonly musicoService = inject(MusicoService);

  async paraMusico(): Promise<PreRequisito[]> {
    const [casas, instrumentos] = await Promise.all([
      this.casaOracaoService.listarTodos(),
      this.instrumentoService.listarTodos(),
    ]);

    return [
      ...(casas.length === 0 ? [CASA] : []),
      ...(instrumentos.length === 0 ? [INSTRUMENTO] : []),
    ];
  }

  async paraLancamento(): Promise<PreRequisito[]> {
    const [casas, eventos, musicos] = await Promise.all([
      this.casaOracaoService.listarTodos(),
      this.eventoService.listarTodos(),
      this.musicoService.listarTodos(),
    ]);

    return [
      ...(casas.length === 0 ? [CASA] : []),
      ...(eventos.length === 0 ? [EVENTO] : []),
      ...(musicos.length === 0 ? [MUSICO] : []),
    ];
  }
}
