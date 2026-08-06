import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Limites dos campos, num lugar só.
 *
 * Os tamanhos abaixo são os mesmos declarados nas colunas do banco
 * (VARCHAR(100), VARCHAR(30)...). Vale dizer por quê: o SQLite **não** faz valer
 * esses tamanhos — ele guarda o texto que vier, de qualquer comprimento. Ou
 * seja, quem de fato limita é o formulário, e é por isso que os dois precisam
 * combinar: se um dia a coluna mudar, estes números mudam junto.
 */
export const TAMANHO_MAXIMO = {
  nome: 100,
  cidade: 50,
  cargo: 30,
  nomeInstrumento: 50,
} as const;

/** Quantos anos para trás a data mais antiga pode chegar. */
const ANOS_PARA_TRAS = 10;

/** 'YYYY-MM-DD' no fuso local — o formato que o <input type="date"> usa. */
function comoTexto(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Hoje. Nada no app se refere ao futuro: um lançamento registra um evento que
 * aconteceu, e um relatório só tem o que mostrar sobre o que já passou.
 */
export function dataMaxima(): string {
  return comoTexto(new Date());
}

/** Dez anos atrás — longe o bastante para o histórico, perto o bastante para
 *  barrar o ano digitado errado (1900, 2202). */
export function dataMinima(): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - ANOS_PARA_TRAS);
  return comoTexto(data);
}

/** 'YYYY-MM-DD' vira 'DD/MM/YYYY' — o formato que se mostra ao usuário. */
export function comoBrasileiro(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * O `min`/`max` do <input type="date"> impede escolher fora do intervalo no
 * calendário, mas não impede digitar: dá para teclar 1999 no campo do ano. Este
 * validador é quem realmente segura o formulário.
 */
export function dataDentroDoIntervalo(): ValidatorFn {
  return (campo: AbstractControl): ValidationErrors | null => {
    const valor = campo.value;
    if (!valor) {
      return null; // vazio é assunto do Validators.required
    }

    const minima = dataMinima();
    const maxima = dataMaxima();
    if (valor < minima || valor > maxima) {
      // Comparar texto 'YYYY-MM-DD' funciona: o formato é ordenável.
      return { foraDoIntervalo: { minima, maxima } };
    }
    return null;
  };
}
