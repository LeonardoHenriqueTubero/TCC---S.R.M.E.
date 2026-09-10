import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const TAMANHO_MAXIMO = {
  nome: 100,
  cidade: 50,
  cargo: 30,
  nomeInstrumento: 50,
} as const;

const ANOS_PARA_TRAS = 10;

function comoTexto(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function dataMaxima(): string {
  return comoTexto(new Date());
}

export function dataMinima(): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - ANOS_PARA_TRAS);
  return comoTexto(data);
}

export function comoBrasileiro(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function dataDentroDoIntervalo(): ValidatorFn {
  return (campo: AbstractControl): ValidationErrors | null => {
    const valor = campo.value;
    if (!valor) {
      return null;
    }

    const minima = dataMinima();
    const maxima = dataMaxima();
    if (valor < minima || valor > maxima) {
      return { foraDoIntervalo: { minima, maxima } };
    }
    return null;
  };
}
