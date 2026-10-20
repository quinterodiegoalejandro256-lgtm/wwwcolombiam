# ⚡ AstroLaser Kids: Guardianes del Espacio

**AstroLaser Kids** es una plataforma lúdica y psicopedagógica diseñada para funcionar en cualquier **navegador web moderno** y en **Pizarras Digitales Interactivas (Smart Boards)**. Permite a los niños interactuar usando la **cámara web con detección de movimientos corporales** (visión artificial con MediaPipe Pose) o mediante **toque táctil directo en la pizarra**, disparando rayos láser para fortalecer la orientación espacial (**Izquierda, Derecha, Arriba y Abajo**) y diversas áreas cognitivas.

Incluye un **Panel Completo de Reportes Psicopedagógicos** para registrar y evaluar el progreso individual y de grupos de estudiantes.

---

## 🎯 Áreas Cognitivas y Objetivos de Aprendizaje

1. **Orientación Espacial y Lateralidad (Eje Central)**:
   - Afianzamiento de las coordenadas espaciales: **IZQUIERDA**, **DERECHA**, **ARRIBA** y **ABAJO**.
   - Detección temprana de confusiones en lateralidad o dificultades con el lado izquierdo/derecho mediante análisis estadístico comparativo.
2. **Atención Selectiva y Discriminación Visual (Radar de Formas y Colores)**:
   - Identificación rápida de figuras geométricas y colores espaciales bajo consignas verbales y visuales.
3. **Cálculo Mental y Razonamiento (Reactor Numérico)**:
   - Detección de números mayores, menores y reconocimiento numérico rápido.
4. **Memoria de Trabajo y Planificación (Secuencia Cósmica)**:
   - Retención y ejecución de secuencias de direcciones motoras estilo "Simon Dice".
5. **Velocidad de Procesamiento y Coordinación Visomotriz**:
   - Medición precisa del tiempo de reacción en milisegundos desde el estímulo hasta el impacto del rayo láser.

---

## 🚀 Modos de Interacción

- **📷 Modo Cámara Web (Movimiento Corporal y Gestos Láser)**:
  - Detección en tiempo real de los brazos y manos del estudiante (muñecas izquierda y derecha).
  - Efecto espejo (*mirroring*) calibrado para que los movimientos se sientan naturales.
  - Anillos de energía sobre las manos que permiten disparar por apuntado sostenido o por movimiento/extensión activa del brazo.
- **🖐️ Modo Pizarra Digital / Táctil**:
  - En pizarras interactivas táctiles o si la cámara no está conectada, los estudiantes pueden tocar directamente los objetivos en la pantalla gigante para disparar los cañones láser.
- **🔊 Asistente de Voz en Español y Sintetizador de Sonido**:
  - Instrucciones habladas en español (*SpeechSynthesis*) que motivan y guían al niño con felicitaciones (*"¡A la derecha!", "¡Super reflejos!"*).
  - Efectos de sonido y música generados proceduralmente con la Web Audio API (sin descargas ni dependencias externas).

---

## 📊 Panel de Reportes y Gestión de Estudiantes

- **Gestión de Aulas y Alumnos**:
  - Creación de grupos escolares y registro de estudiantes con edad, avatar y notas de observación psicomotriz.
- **Métricas Registradas por Sesión**:
  - Porcentaje de acierto global.
  - **Desglose de Lateralidad**: Tasa de acierto y tiempo de reacción diferenciado en **Izquierda** vs **Derecha** y **Arriba** vs **Abajo**.
  - Tiempo medio de reacción (ms).
  - Racha máxima de aciertos (combo).
- **Diagnóstico y Recomendaciones Pedagógicas Automáticas**:
  - El sistema detecta patrones (por ejemplo, si un estudiante tiene menos del 70% en el lado izquierdo pero 100% en el derecho) y sugiere ejercicios específicos de psicomotricidad y esquema corporal.
- **Impresión y Exportación**:
  - Botón para **Imprimir o Guardar en PDF** con diseño limpio y formato escolar.
  - Exportación e importación en formato JSON para respaldar los datos del centro educativo.

---

## 🛠️ Cómo Ejecutar el Juego

No requiere instalación de servidores ni dependencias pesadas. Es 100% web del lado del cliente:

1. Abre la carpeta del proyecto en tu computadora:  
   `C:\Users\Aprendiz\Documents\antigravityN\`
2. Haz doble clic sobre el archivo **`index.html`** para abrirlo en cualquier navegador (Google Chrome, Microsoft Edge, Firefox, Brave).
3. Si utilizas cámara, pulsa **"Permitir"** en el navegador cuando solicite acceso a la cámara web.
4. Para usarlo en una Pizarra Digital o Proyector de aula, pulsa el botón **"⛶ Pantalla Completa"** en la barra superior.

---

## 📁 Estructura del Código

- [`index.html`](file:///c:/Users/Aprendiz/Documents/antigravityN/index.html): Estructura principal, HUD, mini-cámara PIP y vistas de reportes.
- [`css/styles.css`](file:///c:/Users/Aprendiz/Documents/antigravityN/css/styles.css): Diseño futurista espacial de alto contraste, efectos neón, adaptabilidad y estilos de impresión PDF.
- [`js/audio.js`](file:///c:/Users/Aprendiz/Documents/antigravityN/js/audio.js): Sintetizador Web Audio API y locución en español.
- [`js/pose_tracker.js`](file:///c:/Users/Aprendiz/Documents/antigravityN/js/pose_tracker.js): Visión computacional con MediaPipe Pose, modo espejo y control táctil.
- [`js/game.js`](file:///c:/Users/Aprendiz/Documents/antigravityN/js/game.js): Motor del juego espacial, generación de cuadrantes, partículas, láseres y cálculo de métricas.
- [`js/reports.js`](file:///c:/Users/Aprendiz/Documents/antigravityN/js/reports.js): Base de datos de estudiantes en LocalStorage, analítica de lateralidad y motor de diagnósticos.
- [`js/app.js`](file:///c:/Users/Aprendiz/Documents/antigravityN/js/app.js): Controlador de navegación, modales y renderizado de reportes.
