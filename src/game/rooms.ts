// Static room definitions — never mutated at runtime.
// No React imports. No JSX.
// REQ-5, REQ-6, REQ-7, REQ-9

import type { RoomId, RoomDefinition } from './types';

/**
 * All three room definitions keyed by RoomId.
 * Riddles, descriptions, and hints are in Spanish to match the game's language.
 */
export const ROOMS: Record<RoomId, RoomDefinition> = {
  1: {
    id: 1,
    title: 'Biblioteca Maldita',
    emoji: '📚',
    description:
      'Las estanterías crujen bajo el peso de siglos de secretos. Una voz espectral resuena entre las sombras:\n\n' +
      '«Tengo páginas pero no soy un cuaderno,\n' +
      'guardo historias pero no soy un contador,\n' +
      'puedes abrirme sin romperme,\n' +
      'y en cada biblioteca soy el mayor tesoro.\n' +
      '¿Qué soy?»\n\n' +
      'Escribe la respuesta para desbloquear la puerta.',
    hint: 'Piensa en el objeto que más abunda en una biblioteca',
    challengeType: 'text',
  },

  2: {
    id: 2,
    title: 'Laboratorio de la Bruja',
    emoji: '🧪',
    description:
      'El aire huele a azufre y hierbas podridas. Ante ti burbujean tres pociones en sus frascos:\n\n' +
      '🔴 Una poción roja que desprende vapor ardiente.\n' +
      '🟣 Una poción morada que brilla con luz propia.\n' +
      '🟢 Una poción verde con un olor nauseabundo.\n\n' +
      'Un grimorio abierto sobre la mesa dice: «Solo la poción correcta romperá el hechizo. ' +
      'Elige con sabiduría, pues una elección equivocada te mantendrá atrapado para siempre.»',
    hint: 'La piedra amatista revela el color de la poción que romperá el hechizo',
    challengeType: 'potion',
  },

  3: {
    id: 3,
    title: 'Cripta Encantada',
    emoji: '💀',
    description:
      'Una pesada puerta de piedra bloquea la salida. Grabados en ella hay símbolos que forman un código:\n\n' +
      '🦇🦇  🕯️🕯️🕯️🕯️  💀\n\n' +
      'Una inscripción en latín reza: «Cuenta los espíritus de cada tipo, en el orden en que aparecen, ' +
      'y la puerta cederá ante ti.»\n\n' +
      'Introduce el código numérico de tres dígitos para escapar.',
    hint: 'Cuenta cada símbolo en el orden en que aparecen',
    challengeType: 'crypt',
  },
};
