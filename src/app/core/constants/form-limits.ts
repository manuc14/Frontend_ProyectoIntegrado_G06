/* Constantes de límites y reglas de validación de formularios para evitar números mágicos. */
export const FORM_LIMITS = {
  nombreMax: 50,
  apellidosMax: 80,
  emailMax: 120,
  aliasMax: 12,
  passwordMin: 8,
  passwordMax: 128,
  minAgeYears: 4,
} as const;
