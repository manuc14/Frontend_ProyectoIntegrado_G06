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

export const UPLOAD_LIMITS = {
  titleLimit: 50,
  descLimit: 500,
  urlLimit: 200,
  fileMaxSizeMB: 1, // 1MB para archivos de audio
} as const;

export const UPLOAD_FILE_TYPES = {
  audio: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/mp3'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  image: ['image/jpeg', 'image/png']
} as const;

export const PREDEFINED_TAGS = [
  'Entretenimiento',
  'Educación',
  'Tutorial',
  'Documental',
  'Música',
  'Deportes',
  'Tecnología',
  'Arte',
  'Ciencia',
  'Viajes',
  'Cocina',
  'Salud'
] as const;