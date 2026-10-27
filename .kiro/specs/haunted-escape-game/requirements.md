# Requirements Document

## Introduction

Haunted Escape: La Mansión Embrujada es un juego interactivo de tipo Escape Room para Halloween. El jugador despierta atrapado en una mansión embrujada y debe resolver tres desafíos consecutivos para escapar. Toda la lógica reside en el cliente: sin backend, sin autenticación, sin APIs externas.

La aplicación se construye con React, TypeScript y Vite. El progreso se persiste en localStorage. La lógica del juego (validación de respuestas, gestión de estado, persistencia) debe mantenerse separada de los componentes visuales de React para facilitar las pruebas automatizadas con Vitest.

## Glossary

- **Habitación**: cada uno de los tres desafíos consecutivos que el jugador debe superar para escapar de la mansión.
- **Desafío**: el puzzle o rompecabezas específico que presenta cada habitación (acertijo de texto, selección de poción, código numérico).
- **Progreso**: número de habitaciones completadas satisfactoriamente, representado como un contador de 0 a 3.
- **Pista**: texto de ayuda contextual disponible en cada habitación; no revela la respuesta directa.
- **Feedback**: mensaje visual (éxito o error) que se muestra inmediatamente después de que el jugador envía una respuesta.
- **localStorage**: mecanismo de almacenamiento del navegador usado para persistir el progreso entre sesiones.
- **EARS**: notación Easy Approach to Requirements Syntax usada para los criterios de aceptación (palabras clave: WHEN, THEN, WHILE, IF, THE SYSTEM SHALL).

## Requirements

### Requirement 1: Pantalla de inicio

**User Story:** As a player, I want to see an introductory screen with the game story and a clear start action, so that I understand the context before entering the mansion and can resume my progress if I left mid-game.

**WHEN** el jugador abre la aplicación por primera vez (o no tiene progreso guardado),  
**THEN** el sistema SHALL mostrar una pantalla de inicio con la historia introductoria y un botón "Comenzar".

**WHEN** el jugador abre la aplicación y tiene progreso guardado en localStorage,  
**THEN** el sistema SHALL mostrar la pantalla de inicio con un botón "Continuar" que restaura el estado guardado y un botón "Nueva partida" que borra el progreso y reinicia el juego.

#### Acceptance Criteria

1. **WHEN** el jugador pulsa "Comenzar" sin progreso previo, **THEN** el sistema SHALL navegar a la Habitación 1 con el contador de progreso en 0/3.
2. **WHEN** el jugador pulsa "Continuar", **THEN** el sistema SHALL restaurar la habitación y el estado exactamente como quedaron al cerrarse la sesión anterior.
3. **WHEN** el jugador pulsa "Nueva partida", **THEN** el sistema SHALL borrar el progreso de localStorage y navegar a la Habitación 1 con el contador en 0/3.
4. **WHILE** se muestra la pantalla de inicio, **THE SYSTEM SHALL** presentar el texto narrativo de la historia antes del botón de acción.

---

### Requirement 2: Navegación secuencial entre habitaciones

**WHILE** el jugador está en la aplicación,  
**THE SYSTEM SHALL** permitir el acceso únicamente a la habitación actual, bloqueando las siguientes hasta que se resuelva la actual.

#### Acceptance Criteria

1. **WHEN** el jugador intenta acceder a una habitación no desbloqueada (p. ej. directamente por URL o navegación interna), **THEN** el sistema SHALL redirigirlo a la habitación actual activa.
2. **WHEN** el jugador completa una habitación, **THEN** el sistema SHALL desbloquear y mostrar automáticamente la siguiente habitación.
3. **WHEN** el jugador completa la Habitación 3, **THEN** el sistema SHALL mostrar la pantalla de victoria en lugar de navegar a una habitación 4.

---

### Requirement 3: Indicador de progreso

**WHILE** el jugador está en cualquier habitación,  
**THE SYSTEM SHALL** mostrar de forma visible el progreso actual expresado como «X de 3 desafíos completados».

#### Acceptance Criteria

1. **WHEN** el jugador no ha completado ninguna habitación, **THEN** el indicador SHALL mostrar 0/3.
2. **WHEN** el jugador completa una habitación, **THEN** el indicador SHALL incrementarse en 1 de forma inmediata.
3. **WHILE** el jugador está en la pantalla de inicio o de victoria, **THE SYSTEM SHALL** mantener visible el indicador con el valor correcto.

---

### Requirement 4: Persistencia de progreso con localStorage

**WHEN** el jugador completa una habitación o inicia el juego,  
**THEN** el sistema SHALL guardar el estado actual (habitación desbloqueada, habitaciones completadas) en localStorage.

#### Acceptance Criteria

1. **WHEN** el jugador cierra y reabre el navegador habiendo completado N habitaciones, **THEN** el sistema SHALL restaurar el estado con exactamente N habitaciones completadas.
2. **WHEN** el jugador pulsa "Nueva partida" o "Reiniciar", **THEN** el sistema SHALL eliminar la clave de progreso de localStorage.
3. **IF** los datos de localStorage están corruptos o tienen un formato inesperado, **THEN** el sistema SHALL ignorarlos y comenzar desde cero sin lanzar errores visibles al usuario.

---

### Requirement 5: Habitación 1 — Biblioteca Maldita

**WHEN** el jugador accede a la Habitación 1,  
**THEN** el sistema SHALL mostrar el acertijo: *"No tengo boca, pero cuento historias. No tengo piernas, pero puedo llevarte a otros mundos. ¿Qué soy?"* y un campo de texto para ingresar la respuesta.

#### Acceptance Criteria

1. **WHEN** el jugador envía la respuesta "libro" (en cualquier combinación de mayúsculas/minúsculas, con o sin tilde, con espacios exteriores), **THEN** el sistema SHALL considerar la respuesta correcta y mostrar feedback de éxito.
2. **WHEN** el jugador envía cualquier respuesta distinta de las variantes aceptadas de "libro", **THEN** el sistema SHALL mostrar un mensaje de error sin avanzar a la siguiente habitación.
3. **WHEN** el jugador pulsa el botón de pista, **THEN** el sistema SHALL mostrar la pista: *"Piensa en el objeto que más abunda en una biblioteca"* sin revelar la respuesta directa.
4. **WHEN** el jugador envía el formulario con el campo vacío, **THEN** el sistema SHALL mostrar un mensaje de validación sin procesar la respuesta.

---

### Requirement 6: Habitación 2 — Laboratorio de la Bruja

**WHEN** el jugador accede a la Habitación 2,  
**THEN** el sistema SHALL mostrar tres opciones de poción (roja, morada, verde) como botones seleccionables y la pista visible: *"La piedra amatista revela el color de la poción que romperá el hechizo"*.

#### Acceptance Criteria

1. **WHEN** el jugador selecciona la poción morada y confirma, **THEN** el sistema SHALL mostrar feedback de éxito y desbloquear la Habitación 3.
2. **WHEN** el jugador selecciona la poción roja o verde y confirma, **THEN** el sistema SHALL mostrar un mensaje de error sin avanzar.
3. **WHEN** el jugador pulsa el botón de pista, **THEN** el sistema SHALL mostrar la pista sin revelar directamente el color correcto.
4. **WHEN** el jugador intenta confirmar sin haber seleccionado ninguna poción, **THEN** el sistema SHALL mostrar un mensaje de validación.
5. **WHILE** el jugador navega por la habitación, **THE SYSTEM SHALL** mostrar visualmente las tres pociones con sus colores representativos (rojo, morado, verde).

---

### Requirement 7: Habitación 3 — Cripta Encantada

**WHEN** el jugador accede a la Habitación 3,  
**THEN** el sistema SHALL mostrar los símbolos (2 murciélagos 🦇, 4 velas 🕯️, 1 calavera 💀) y un campo numérico de tres dígitos para ingresar el código.

#### Acceptance Criteria

1. **WHEN** el jugador ingresa el código "241" y lo confirma, **THEN** el sistema SHALL mostrar feedback de éxito y navegar a la pantalla de victoria.
2. **WHEN** el jugador ingresa cualquier código distinto de "241", **THEN** el sistema SHALL mostrar un mensaje de error sin avanzar.
3. **WHEN** el jugador pulsa el botón de pista, **THEN** el sistema SHALL mostrar: *"Cuenta cada símbolo en el orden en que aparecen"* sin revelar el código.
4. **WHEN** el jugador intenta confirmar con un campo vacío o con menos de 3 dígitos, **THEN** el sistema SHALL mostrar un mensaje de validación.
5. **WHILE** el jugador está en la Habitación 3, **THE SYSTEM SHALL** mostrar los símbolos de forma clara y contable.

---

### Requirement 8: Feedback de respuesta

**WHEN** el jugador envía una respuesta en cualquier habitación,  
**THEN** el sistema SHALL mostrar un mensaje de feedback diferenciado (éxito o error) antes de cualquier transición.

#### Acceptance Criteria

1. **WHEN** la respuesta es correcta, **THEN** el sistema SHALL mostrar un mensaje de éxito con animación de transición antes de avanzar.
2. **WHEN** la respuesta es incorrecta, **THEN** el sistema SHALL mostrar un mensaje de error con animación visual distintiva (p. ej. sacudida) sin avanzar.
3. **WHEN** se muestra el feedback de error, **THEN** el sistema SHALL mantener el valor ingresado por el jugador en el campo de entrada para que pueda corregirlo.

---

### Requirement 9: Botón de pista por habitación

**WHILE** el jugador está en cualquier habitación sin haberla completado,  
**THE SYSTEM SHALL** mostrar un botón "Ver pista" que, al pulsarse, revele la pista de esa habitación.

#### Acceptance Criteria

1. **WHEN** el jugador pulsa "Ver pista", **THEN** el sistema SHALL mostrar la pista correspondiente a la habitación activa.
2. **WHEN** la pista ya está visible, **THEN** el sistema SHALL permitir al jugador ocultarla pulsando el mismo botón (toggle).
3. **WHEN** el jugador avanza a la siguiente habitación, **THEN** la pista de la habitación anterior SHALL ocultarse automáticamente.

---

### Requirement 10: Pantalla de victoria

**WHEN** el jugador completa la Habitación 3,  
**THEN** el sistema SHALL mostrar una pantalla de victoria con mensaje de felicitación y un botón "Jugar de nuevo".

#### Acceptance Criteria

1. **WHEN** se muestra la pantalla de victoria, **THEN** el sistema SHALL mostrar el mensaje: *"¡Escapaste de la Mansión Embrujada!"* y el indicador de progreso en 3/3.
2. **WHEN** el jugador pulsa "Jugar de nuevo", **THEN** el sistema SHALL borrar el progreso de localStorage y retornar a la pantalla de inicio.
3. **WHILE** se muestra la pantalla de victoria, **THE SYSTEM SHALL** reproducir una animación de celebración temática (p. ej. confeti en colores Halloween).

---

### Requirement 11: Separación de lógica y presentación

**WHILE** el sistema está en desarrollo,  
**THE SYSTEM SHALL** mantener las reglas del juego (validación de respuestas, gestión de estado, persistencia) separadas de los componentes visuales de React.

#### Acceptance Criteria

1. Las reglas de validación de cada habitación SHALL residir en módulos o hooks independientes de los componentes de UI, verificable mediante pruebas unitarias que no monten componentes React.
2. La lógica de persistencia (leer/escribir localStorage) SHALL estar encapsulada en un módulo o hook dedicado.

---

### Requirement 12: Diseño visual con temática Halloween

**WHILE** el jugador usa la aplicación,  
**THE SYSTEM SHALL** presentar una interfaz con fondo oscuro, paleta violeta y naranja, estética de mansión encantada, y animaciones de transición.

#### Acceptance Criteria

1. El diseño SHALL ser responsive y funcionar correctamente en viewport de 375 px (móvil) y 1280 px (desktop).
2. El sistema SHALL NO depender de imágenes externas; todos los recursos visuales serán CSS, SVG inline o emojis.
3. Las animaciones de transición entre habitaciones y los estados de feedback SHALL usar CSS transitions/animations sin librerías externas de animación.

---

### Requirement 13: Pruebas automatizadas con Vitest

**WHILE** el sistema está en desarrollo,  
**THE SYSTEM SHALL** incluir pruebas unitarias con Vitest que cubran la lógica del juego.

#### Acceptance Criteria

1. SHALL existir pruebas unitarias para la validación de respuestas de cada habitación (correcta, incorrecta, vacía, variantes de normalización).
2. SHALL existir pruebas para la lógica de persistencia (guardar, restaurar, borrar, datos corruptos).
3. SHALL existir pruebas para la gestión de estado (avance de habitación, reinicio).
4. Todos los tests SHALL pasar con `vitest run` sin errores.
