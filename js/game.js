/**
 * Game Engine - AstroLaser Kids
 * Maneja los modos de juego, la física, el renderizado de gráficos espaciales,
 * el sistema de partículas, rayos láser y la recolección de métricas cognitivas.
 */

class AstroGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;

        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'directions'; // directions, colors_shapes, numbers, sequences, freeplay
        this.difficulty = 'normal'; // easy, normal, hard

        // Estado de la sesión actual
        this.currentStudent = null;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.timeLeft = 60;
        this.timerInterval = null;
        this.sessionStartTime = 0;

        // Registro de métricas para reportes
        this.sessionTrials = [];

        // Objetivos activos
        this.targets = [];
        this.currentTarget = null;
        this.currentSequence = [];
        this.sequenceIndex = 0;
        this.showingSequence = false;
        this.promptText = "";
        this.promptSubtext = "";
        this.promptStartTime = 0;

        // Efectos visuales
        this.lasers = [];
        this.particles = [];
        this.floatingTexts = [];
        this.screenShake = 0;

        // Zonas de dirección
        this.zones = {
            up:    { id: 'up',    name: 'ARRIBA',    label: 'ARRIBA',    color: '#FACC15', icon: '▲' },
            down:  { id: 'down',  name: 'ABAJO',     label: 'ABAJO',     color: '#A855F7', icon: '▼' },
            left:  { id: 'left',  name: 'IZQUIERDA', label: 'IZQUIERDA', color: '#06B6D4', icon: '◄' },
            right: { id: 'right', name: 'DERECHA',   label: 'DERECHA',   color: '#F97316', icon: '►' }
        };

        // Catálogo de Animales Interactivos con 2 estados:
        // Estado 2: Esperando / serio / enojado (ej: elefante 2)
        // Estado 1: Al dispararle / celebrando feliz (ej: elefante 1)
        this.animalCatalog = [
            {
                id: 'elefante',
                name: 'Elefante',
                article: 'al',
                icon: '🐘',
                idleSrc: 'assets/animals/elefante_2.jpeg',
                hitSrc: 'assets/animals/elefante_1.jpeg'
            },
            {
                id: 'koala',
                name: 'Koala',
                article: 'al',
                icon: '🐨',
                idleSrc: 'assets/animals/koala_2.jpeg',
                hitSrc: 'assets/animals/koala_1.jpeg'
            },
            {
                id: 'gorila',
                name: 'Gorila',
                article: 'al',
                icon: '🦍',
                idleSrc: 'assets/animals/gorila_2.jpeg',
                hitSrc: 'assets/animals/gorila_1.jpeg'
            },
            {
                id: 'huron',
                name: 'Hurón',
                article: 'al',
                icon: '🐾',
                idleSrc: 'assets/animals/huron_2.jpeg',
                hitSrc: 'assets/animals/huron_1.jpeg'
            },
            {
                id: 'zorro',
                name: 'Zorrito',
                article: 'al',
                icon: '🦊',
                idleSrc: 'assets/animals/zorro_2.jpeg',
                hitSrc: 'assets/animals/zorro_1.jpeg'
            }
        ];

        // Pre-cargar imágenes para renderizado instantáneo sin parpadeo
        this.animalCatalog.forEach(a => {
            a.idleImg = new Image();
            a.idleImg.src = a.idleSrc;
            a.hitImg = new Image();
            a.hitImg.src = a.hitSrc;
        });

        // Estado del cursor de manos en pantalla
        this.handCursors = {
            left:  { x: 0, y: 0, active: false, charge: 0, targetLock: null },
            right: { x: 0, y: 0, active: false, charge: 0, targetLock: null },
            touch: { x: 0, y: 0, active: false, charge: 0, targetLock: null }
        };

        // Callbacks de eventos
        this.onGameOver = null;
        this.onUpdateHUD = null;

        this.render = this.render.bind(this);
    }

    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Conectar eventos del PoseTracker
        window.poseTracker.onPoseResults = this.handlePoseUpdate.bind(this);
        window.poseTracker.onShootLaser = this.handleLaserShoot.bind(this);

        // Eventos táctiles para Pizarra Digital
        this.canvas.addEventListener('pointerdown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const normX = (e.clientX - rect.left) / rect.width;
            const normY = (e.clientY - rect.top) / rect.height;
            window.poseTracker.handleTouchOrClick(normX, normY);
        });

        // Loop de renderizado continuo
        requestAnimationFrame(this.render);
    }

    resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        this.width = parent.clientWidth || 800;
        this.height = parent.clientHeight || 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    startSession(student, mode = 'directions', duration = 60, difficulty = 'normal') {
        this.currentStudent = student;
        this.currentMode = mode;
        this.difficulty = difficulty;
        this.timeLeft = duration;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.sessionTrials = [];
        this.lasers = [];
        this.particles = [];
        this.floatingTexts = [];
        this.sessionStartTime = Date.now();
        this.roundCount = 0;
        this.isRunning = true;
        this.isPaused = false;

        this.nextRound();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isRunning || this.isPaused) return;
            this.timeLeft--;
            if (this.onUpdateHUD) this.onUpdateHUD();
            if (this.timeLeft <= 0) {
                this.endSession();
            }
        }, 1000);

        if (this.onUpdateHUD) this.onUpdateHUD();
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    endSession() {
        this.isRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        window.soundCtrl.playVictory();
        window.soundCtrl.speak("¡Misión cumplida! Excelente trabajo en el espacio.", true);

        // Calcular resumen de la sesión
        const summary = this.calculateSessionMetrics();

        // Guardar reporte del estudiante
        if (window.reportsManager && this.currentStudent) {
            window.reportsManager.saveSessionReport(this.currentStudent.id, summary);
        }

        if (this.onGameOver) {
            this.onGameOver(summary);
        }
    }

    calculateSessionMetrics() {
        const totalTrials = this.sessionTrials.length;
        const correctTrials = this.sessionTrials.filter(t => t.correct).length;
        const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

        // Desglose por dirección
        const dirStats = {
            left:  { total: 0, correct: 0, times: [] },
            right: { total: 0, correct: 0, times: [] },
            up:    { total: 0, correct: 0, times: [] },
            down:  { total: 0, correct: 0, times: [] }
        };

        this.sessionTrials.forEach(t => {
            if (dirStats[t.targetDir]) {
                dirStats[t.targetDir].total++;
                if (t.correct) {
                    dirStats[t.targetDir].correct++;
                    dirStats[t.targetDir].times.push(t.reactionTime);
                }
            }
        });

        const avgReactionTime = this.sessionTrials.filter(t => t.correct).reduce((acc, t, _, arr) => {
            return acc + (t.reactionTime / (arr.length || 1));
        }, 0);

        return {
            date: new Date().toISOString(),
            mode: this.currentMode,
            difficulty: this.difficulty,
            score: this.score,
            maxCombo: this.maxCombo,
            totalTrials,
            correctTrials,
            accuracy,
            avgReactionTime: Math.round(avgReactionTime) || 0,
            directionalBreakdown: {
                left: {
                    total: dirStats.left.total,
                    accuracy: dirStats.left.total > 0 ? Math.round((dirStats.left.correct / dirStats.left.total) * 100) : 0,
                    avgTime: dirStats.left.times.length ? Math.round(dirStats.left.times.reduce((a,b)=>a+b,0)/dirStats.left.times.length) : 0
                },
                right: {
                    total: dirStats.right.total,
                    accuracy: dirStats.right.total > 0 ? Math.round((dirStats.right.correct / dirStats.right.total) * 100) : 0,
                    avgTime: dirStats.right.times.length ? Math.round(dirStats.right.times.reduce((a,b)=>a+b,0)/dirStats.right.times.length) : 0
                },
                up: {
                    total: dirStats.up.total,
                    accuracy: dirStats.up.total > 0 ? Math.round((dirStats.up.correct / dirStats.up.total) * 100) : 0,
                    avgTime: dirStats.up.times.length ? Math.round(dirStats.up.times.reduce((a,b)=>a+b,0)/dirStats.up.times.length) : 0
                },
                down: {
                    total: dirStats.down.total,
                    accuracy: dirStats.down.total > 0 ? Math.round((dirStats.down.correct / dirStats.down.total) * 100) : 0,
                    avgTime: dirStats.down.times.length ? Math.round(dirStats.down.times.reduce((a,b)=>a+b,0)/dirStats.down.times.length) : 0
                }
            },
            trials: this.sessionTrials
        };
    }

    nextRound() {
        if (!this.isRunning) return;

        const dirs = ['left', 'right', 'up', 'down'];
        this.targets = [];

        // Generar posiciones físicas en la pantalla
        const padding = 125;
        const targetRadius = this.difficulty === 'easy' ? 76 : (this.difficulty === 'normal' ? 68 : 58);

        const positions = {
            up:    { x: this.width * 0.5, y: padding, dir: 'up' },
            down:  { x: this.width * 0.5, y: this.height - padding, dir: 'down' },
            left:  { x: padding, y: this.height * 0.5, dir: 'left' },
            right: { x: this.width - padding, y: this.height * 0.5, dir: 'right' }
        };

        this.promptStartTime = performance.now();

        if (this.currentMode === 'directions') {
            // Misión 1: Orientación Espacial / Lateralidad con Animales Interactivos
            let targetDir;
            let targetAnimal;
            let chosenAnimals;

            if (this.roundCount === 0) {
                // Ronda Inicial: Elefante en la izquierda (Estado 2), tal como solicitó el usuario
                targetDir = 'left';
                const elephant = this.animalCatalog.find(a => a.id === 'elefante');
                const others = this.animalCatalog.filter(a => a.id !== 'elefante').sort(() => Math.random() - 0.5);
                chosenAnimals = {
                    left: elephant,
                    right: others[0],
                    up: others[1],
                    down: others[2]
                };
                targetAnimal = elephant;
            } else {
                // Rondas siguientes: barajar los 5 animales y colocarlos en los 4 cuadrantes
                const shuffledAnimals = [...this.animalCatalog].sort(() => Math.random() - 0.5);
                targetDir = dirs[Math.floor(Math.random() * dirs.length)];
                chosenAnimals = {
                    left: shuffledAnimals[0],
                    right: shuffledAnimals[1],
                    up: shuffledAnimals[2],
                    down: shuffledAnimals[3]
                };
                targetAnimal = chosenAnimals[targetDir];
            }
            this.roundCount++;

            const zoneInfo = this.zones[targetDir];

            dirs.forEach(d => {
                const isTarget = d === targetDir;
                const animal = chosenAnimals[d];
                this.targets.push({
                    id: d,
                    direction: d,
                    x: positions[d].x,
                    y: positions[d].y,
                    radius: targetRadius,
                    color: this.zones[d].color,
                    label: this.zones[d].name,
                    icon: this.zones[d].icon,
                    animal: animal,
                    state: 'idle', // Inicia en Estado 2 (esperando / serio)
                    isCorrect: isTarget,
                    pulse: 0
                });
            });

            this.currentTarget = targetDir;
            // En vez de decir la dirección, anuncia el animal que está en ese lugar
            this.promptText = `¡DISPARA ${targetAnimal.article.toUpperCase()} ${targetAnimal.name.toUpperCase()}!`;
            this.promptSubtext = `${targetAnimal.icon} Está en la ${zoneInfo.name} ${zoneInfo.icon}`;

            window.soundCtrl.speak(`¡Dispara ${targetAnimal.article} ${targetAnimal.name.toLowerCase()}!`, true);
        }
        else if (this.currentMode === 'colors_shapes') {
            // Misión 2: Radar de Formas y Colores (Atención Selectiva)
            const shapes = [
                { name: 'Estrella', shape: 'star', color: '#FACC15', colorName: 'Amarilla' },
                { name: 'Cristal',  shape: 'diamond', color: '#06B6D4', colorName: 'Azul' },
                { name: 'Esfera',   shape: 'circle', color: '#EF4444', colorName: 'Roja' },
                { name: 'Prisma',   shape: 'triangle', color: '#10B981', colorName: 'Verde' }
            ];

            // Mezclar formas aleatoriamente en los 4 cuadrantes
            const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);
            const targetIdx = Math.floor(Math.random() * 4);
            const correctShape = shuffledShapes[targetIdx];
            const targetDir = dirs[targetIdx];

            dirs.forEach((d, idx) => {
                const shapeItem = shuffledShapes[idx];
                this.targets.push({
                    id: d,
                    direction: d,
                    x: positions[d].x,
                    y: positions[d].y,
                    radius: targetRadius,
                    color: shapeItem.color,
                    label: shapeItem.name,
                    shape: shapeItem.shape,
                    colorName: shapeItem.colorName,
                    isCorrect: idx === targetIdx,
                    pulse: 0
                });
            });

            this.currentTarget = targetDir;
            this.promptText = `¡${correctShape.name.toUpperCase()} ${correctShape.colorName.toUpperCase()}!`;
            this.promptSubtext = `Encuéntrala en: ${this.zones[targetDir].name}`;

            window.soundCtrl.speak(`¡Busca la ${correctShape.name} ${correctShape.colorName}!`, true);
        }
        else if (this.currentMode === 'numbers') {
            // Misión 3: Reactor Numérico (Cálculo y Razonamiento)
            const nums = [];
            while (nums.length < 4) {
                const n = Math.floor(Math.random() * 9) + 1;
                if (!nums.includes(n)) nums.push(n);
            }

            const ruleType = Math.random() > 0.5 ? 'mayor' : 'menor';
            const sorted = [...nums].sort((a,b) => ruleType === 'mayor' ? b - a : a - b);
            const targetNumber = sorted[0];
            const targetIdx = nums.indexOf(targetNumber);
            const targetDir = dirs[targetIdx];

            dirs.forEach((d, idx) => {
                this.targets.push({
                    id: d,
                    direction: d,
                    x: positions[d].x,
                    y: positions[d].y,
                    radius: targetRadius,
                    color: this.zones[d].color,
                    label: `${nums[idx]}`,
                    number: nums[idx],
                    isCorrect: idx === targetIdx,
                    pulse: 0
                });
            });

            this.currentTarget = targetDir;
            this.promptText = `¡NÚMERO ${ruleType.toUpperCase()}!`;
            this.promptSubtext = `Encuentra el número ${ruleType}: [${targetNumber}]`;

            window.soundCtrl.speak(`¡Dispara al número ${ruleType}!`, true);
        }
        else if (this.currentMode === 'sequences') {
            // Misión 4: Secuencia Cósmica (Memoria de Trabajo)
            const seqLength = this.difficulty === 'easy' ? 2 : 3;
            this.currentSequence = [];
            for (let i = 0; i < seqLength; i++) {
                this.currentSequence.push(dirs[Math.floor(Math.random() * dirs.length)]);
            }
            this.sequenceIndex = 0;
            this.showingSequence = true;

            dirs.forEach(d => {
                this.targets.push({
                    id: d,
                    direction: d,
                    x: positions[d].x,
                    y: positions[d].y,
                    radius: targetRadius,
                    color: this.zones[d].color,
                    label: this.zones[d].name,
                    icon: this.zones[d].icon,
                    isCorrect: false,
                    pulse: 0
                });
            });

            this.playSequenceDemonstration();
        }
        else if (this.currentMode === 'freeplay') {
            // Misión 5: Modo Libre con Animales
            const shuffledAnimals = [...this.animalCatalog].sort(() => Math.random() - 0.5);
            dirs.forEach((d, idx) => {
                const animal = shuffledAnimals[idx];
                this.targets.push({
                    id: d,
                    direction: d,
                    x: positions[d].x,
                    y: positions[d].y,
                    radius: targetRadius,
                    color: this.zones[d].color,
                    label: this.zones[d].name,
                    icon: this.zones[d].icon,
                    animal: animal,
                    state: 'idle',
                    isCorrect: true, // Cualquier objetivo suma
                    pulse: 0
                });
            });

            this.promptText = "¡DISPARO LIBRE A LOS ANIMALES!";
            this.promptSubtext = "Usa tus brazos para dispararles y hacerlos felices";
        }

        if (this.onUpdateHUD) this.onUpdateHUD();
    }

    playSequenceDemonstration() {
        this.promptText = "¡MEMORIZA LA SECUENCIA!";
        this.promptSubtext = "Observa el orden de las señales luminosas";
        window.soundCtrl.speak("¡Atención! Memoriza la secuencia.", true);

        let step = 0;
        const playNextStep = () => {
            if (step < this.currentSequence.length) {
                const dir = this.currentSequence[step];
                const target = this.targets.find(t => t.direction === dir);
                if (target) {
                    target.pulse = 1.0;
                    window.soundCtrl.playCharge();
                    window.soundCtrl.speak(this.zones[dir].name);
                }
                step++;
                setTimeout(playNextStep, 1100);
            } else {
                this.showingSequence = false;
                this.promptText = "¡TU TURNO! REPITE LA SECUENCIA";
                this.promptSubtext = `Paso 1 de ${this.currentSequence.length}: ${this.zones[this.currentSequence[0]].name}`;
                this.promptStartTime = performance.now();
                window.soundCtrl.speak("¡Tu turno! Dispara en el mismo orden.");
            }
        };

        setTimeout(playNextStep, 800);
    }

    handlePoseUpdate(poseData) {
        if (!poseData) return;

        // Mapear coordenadas de manos normalizadas a resolución del Canvas
        if (poseData.leftHand.visible) {
            this.handCursors.left.x = poseData.leftHand.rawX * this.width;
            this.handCursors.left.y = poseData.leftHand.rawY * this.height;
            this.handCursors.left.active = true;
            this.checkHoverAim('left', this.handCursors.left.x, this.handCursors.left.y);
        } else {
            this.handCursors.left.active = false;
        }

        if (poseData.rightHand.visible) {
            this.handCursors.right.x = poseData.rightHand.rawX * this.width;
            this.handCursors.right.y = poseData.rightHand.rawY * this.height;
            this.handCursors.right.active = true;
            this.checkHoverAim('right', this.handCursors.right.x, this.handCursors.right.y);
        } else {
            this.handCursors.right.active = false;
        }
    }

    checkHoverAim(handName, x, y) {
        if (!this.isRunning || this.showingSequence) return;

        const cursor = this.handCursors[handName];
        let foundTarget = null;

        for (const t of this.targets) {
            const dist = Math.hypot(x - t.x, y - t.y);
            if (dist < t.radius * 1.35) {
                foundTarget = t;
                break;
            }
        }

        if (foundTarget) {
            if (cursor.targetLock === foundTarget) {
                cursor.charge += 0.055;
                if (cursor.charge >= 1.0) {
                    // Carga completa: Disparar automáticamente
                    this.handleLaserShoot(handName, cursor.x / this.width, cursor.y / this.height);
                    cursor.charge = 0;
                }
            } else {
                cursor.targetLock = foundTarget;
                cursor.charge = 0.2;
                window.soundCtrl.playCharge();
            }
        } else {
            cursor.targetLock = null;
            cursor.charge = 0;
        }
    }

    handleLaserShoot(handName, normX, normY) {
        if (!this.isRunning || this.showingSequence) return;

        const startX = normX * this.width;
        const startY = normY * this.height;
        const now = performance.now();
        const reactionTime = Math.round(now - this.promptStartTime);

        // Buscar qué objetivo fue alcanzado o apuntado
        let hitTarget = null;
        let minDistance = Infinity;

        this.targets.forEach(t => {
            const dist = Math.hypot(startX - t.x, startY - t.y);
            if (dist < minDistance) {
                minDistance = dist;
                hitTarget = t;
            }
        });

        const targetX = hitTarget ? hitTarget.x : startX;
        const targetY = hitTarget ? hitTarget.y : startY;

        // Crear haz láser visual con origen en la mano del niño
        this.createLaserBeam(startX, startY, targetX, targetY, handName);
        window.soundCtrl.playLaser(handName);

        if (!hitTarget) return;

        // Comprobación de Acierto / Error
        let isCorrect = false;

        if (this.currentMode === 'sequences') {
            const expectedDir = this.currentSequence[this.sequenceIndex];
            if (hitTarget.direction === expectedDir) {
                this.sequenceIndex++;
                if (this.sequenceIndex >= this.currentSequence.length) {
                    isCorrect = true;
                } else {
                    // Paso intermedio correcto
                    window.soundCtrl.playSuccess();
                    this.createExplosion(hitTarget.x, hitTarget.y, hitTarget.color);
                    this.promptSubtext = `¡Bien! Siguiente: ${this.zones[this.currentSequence[this.sequenceIndex]].name}`;
                    return;
                }
            }
        } else {
            isCorrect = hitTarget.isCorrect;
        }

        // Registrar intento para analíticas
        this.sessionTrials.push({
            timestamp: Date.now(),
            targetDir: this.currentTarget || hitTarget.direction,
            shotDir: hitTarget.direction,
            handUsed: handName,
            correct: isCorrect,
            reactionTime: reactionTime,
            mode: this.currentMode
        });

        if (isCorrect) {
            this.handleSuccessHit(hitTarget);
        } else {
            this.handleMissHit(hitTarget);
        }
    }

    handleSuccessHit(target) {
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // Cambiar el estado del animal a 'hit' (se activa la Imagen 1: feliz y celebrando)
        target.state = 'hit';
        target.pulse = 1.8;

        const basePoints = 100;
        const comboBonus = (this.combo - 1) * 25;
        const points = basePoints + comboBonus;
        this.score += points;

        // Efectos audiovisuales
        this.createExplosion(target.x, target.y, target.color);
        if (target.animal) {
            this.addFloatingText(`¡${target.animal.name} Feliz! +${points}`, target.x, target.y - 30, '#10B981', 26);
        } else {
            this.addFloatingText(`+${points}`, target.x, target.y, '#10B981');
        }

        if (this.combo > 2) {
            this.addFloatingText(`¡COMBO x${this.combo}!`, this.width / 2, this.height * 0.4, '#F59E0B', 28);
        }

        this.screenShake = 12;
        window.soundCtrl.playExplosion();
        window.soundCtrl.playSuccess();

        // Felicitaciones habladas personalizadas con el animal
        if (target.animal) {
            window.soundCtrl.speak(`¡Excelente! ¡El ${target.animal.name.toLowerCase()} está muy feliz!`, true);
        } else {
            const praises = ["¡Excelente!", "¡Muy bien!", "¡Increíble!", "¡Directo al blanco!", "¡Super reflejos!"];
            const praise = praises[Math.floor(Math.random() * praises.length)];
            window.soundCtrl.speak(praise);
        }

        // Siguiente ronda (tiempo para contemplar al animal celebrando)
        setTimeout(() => this.nextRound(), 1200);
    }

    handleMissHit(target) {
        this.combo = 0;
        target.pulse = 0.5;
        this.createExplosion(target.x, target.y, '#9CA3AF', 10);
        this.addFloatingText("¡Cerca!", target.x, target.y, '#EF4444');
        window.soundCtrl.playError();

        // Mensaje de aliento didáctico
        const hitAnimalName = target.animal ? target.animal.name : '';
        const correctTarget = this.targets.find(t => t.direction === this.currentTarget);
        const correctAnimalName = correctTarget && correctTarget.animal ? correctTarget.animal.name : '';
        const correctZone = this.zones[this.currentTarget];

        if (hitAnimalName && correctAnimalName && correctZone) {
            window.soundCtrl.speak(`¡Ese es el ${hitAnimalName}! Busca al ${correctAnimalName} en la ${correctZone.name}!`, true);
        } else if (correctZone) {
            window.soundCtrl.speak(`Era hacia ${correctZone.name}. ¡Inténtalo de nuevo!`, true);
        }

        setTimeout(() => this.nextRound(), 1000);
    }

    createLaserBeam(x1, y1, x2, y2, hand) {
        const color = hand === 'left' ? '#06B6D4' : (hand === 'right' ? '#F97316' : '#EC4899');
        this.lasers.push({
            x1, y1, x2, y2,
            color,
            alpha: 1.0,
            width: 14
        });
    }

    createExplosion(x, y, color, count = 26) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                radius: Math.random() * 5 + 3,
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    addFloatingText(text, x, y, color = '#FFFFFF', size = 24) {
        this.floatingTexts.push({
            text, x, y, color, size,
            alpha: 1.0,
            vy: -2
        });
    }

    render() {
        if (!this.ctx) return;

        // Efecto Screen Shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const offsetX = (Math.random() - 0.5) * this.screenShake;
            const offsetY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(offsetX, offsetY);
            this.screenShake *= 0.82;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Fondo Espacial con Nebulosa y Estrellas
        this.renderBackground();

        // Si está corriendo, renderizar elementos de juego
        if (this.isRunning) {
            this.renderDirectionMarkers();
            this.renderTargets();
            this.renderLasers();
            this.renderParticles();
            this.renderFloatingTexts();
            this.renderHandAuras();
        }

        this.ctx.restore();

        requestAnimationFrame(this.render);
    }

    renderBackground() {
        // Fondo base espacial profundo
        this.ctx.fillStyle = '#0B0F19';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Cuadrícula futurista sutil
        this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        this.ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Líneas guía centrales de cuadrantes
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        this.ctx.setLineDash([6, 6]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.moveTo(0, this.height / 2);
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    renderDirectionMarkers() {
        // Indicadores gigantes en los 4 bordes para fijación cognitiva en la Pizarra Digital
        const time = performance.now() * 0.003;

        // ARRIBA
        this.drawDirectionBadge(this.width / 2, 38, '▲ ARRIBA', this.zones.up.color);
        // ABAJO
        this.drawDirectionBadge(this.width / 2, this.height - 38, '▼ ABAJO', this.zones.down.color);
        // IZQUIERDA
        this.drawDirectionBadge(50, this.height / 2, '◄ IZQUIERDA', this.zones.left.color, true);
        // DERECHA
        this.drawDirectionBadge(this.width - 50, this.height / 2, 'DERECHA ►', this.zones.right.color, true);
    }

    drawDirectionBadge(x, y, text, color, isVertical = false) {
        this.ctx.save();
        this.ctx.translate(x, y);
        if (isVertical) {
            this.ctx.rotate(x < this.width / 2 ? -Math.PI / 2 : Math.PI / 2);
        }

        this.ctx.font = 'bold 16px "Fredoka", "Nunito", sans-serif';
        const textWidth = this.ctx.measureText(text).width;
        const padX = 14;
        const padY = 8;

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(-textWidth/2 - padX, -16 - padY, textWidth + padX * 2, 32 + padY, 12);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, 0, 0);

        this.ctx.restore();
    }

    renderTargets() {
        const time = performance.now() * 0.004;

        this.targets.forEach(t => {
            this.ctx.save();
            const pulseScale = 1 + Math.sin(time + t.x) * 0.06 + (t.pulse || 0);
            const r = t.radius * pulseScale;

            if (t.animal) {
                // RENDERIZADO DE ANIMAL CON 2 ESTADOS
                const isHit = t.state === 'hit';
                const img = isHit ? t.animal.hitImg : t.animal.idleImg;
                const ringColor = isHit ? '#10B981' : t.color;

                // Anillo exterior brillante
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, r + 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = ringColor;
                this.ctx.lineWidth = isHit ? 6 : 4;
                this.ctx.shadowColor = ringColor;
                this.ctx.shadowBlur = isHit ? 26 : 16;
                this.ctx.stroke();

                // Fondo blanco circular para el retrato
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fill();

                // Recortar y dibujar la imagen centrada
                if (img && img.complete && img.naturalWidth > 0) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(t.x, t.y, r - 2, 0, Math.PI * 2);
                    this.ctx.clip();

                    const aspect = img.width / img.height;
                    let sw, sh, sx, sy;
                    if (aspect > 1) {
                        sh = img.height;
                        sw = img.height;
                        sx = (img.width - sw) / 2;
                        sy = 0;
                    } else {
                        sw = img.width;
                        sh = img.width;
                        sx = 0;
                        sy = Math.max(0, (img.height - sh) * 0.12);
                    }
                    const drawD = (r - 2) * 2;
                    this.ctx.drawImage(img, sx, sy, sw, sh, t.x - r + 2, t.y - r + 2, drawD, drawD);
                    this.ctx.restore();
                }

                // Destellos de celebración al dispararle
                if (isHit) {
                    this.drawCelebrationSparkles(t.x, t.y, r);
                }

                // Placa inferior con el nombre del animal y su icono
                this.drawAnimalBadge(t.x, t.y + r + 22, `${t.animal.icon} ${t.animal.name.toUpperCase()}`, ringColor);
            } else {
                // Modo estándar (Formas geométricas / números)
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, r + 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = t.color;
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = t.color;
                this.ctx.shadowBlur = 18;
                this.ctx.stroke();

                const grad = this.ctx.createRadialGradient(t.x - 10, t.y - 10, 4, t.x, t.y, t.radius);
                grad.addColorStop(0, '#FFFFFF');
                grad.addColorStop(0.3, t.color);
                grad.addColorStop(1, '#0F172A');

                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
                this.ctx.fillStyle = grad;
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                if (t.shape === 'star') {
                    this.drawStar(t.x, t.y, 5, t.radius * 0.55, t.radius * 0.28);
                } else if (t.shape === 'diamond') {
                    this.drawDiamond(t.x, t.y, t.radius * 0.5);
                } else if (t.shape === 'triangle') {
                    this.drawTriangle(t.x, t.y, t.radius * 0.5);
                } else {
                    this.ctx.font = 'bold 22px "Fredoka", sans-serif';
                    this.ctx.fillText(t.label || t.icon, t.x, t.y);
                }
            }

            if (t.pulse > 0) t.pulse *= 0.94;

            this.ctx.restore();
        });
    }

    drawAnimalBadge(x, y, text, color) {
        this.ctx.save();
        this.ctx.font = 'bold 15px "Fredoka", sans-serif';
        const textWidth = this.ctx.measureText(text).width;
        const padX = 14;
        const padY = 6;

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(x - textWidth/2 - padX, y - 12 - padY, textWidth + padX * 2, 24 + padY, 12);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawCelebrationSparkles(cx, cy, r) {
        const time = performance.now() * 0.006;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) + time;
            const dist = r + 14 + Math.sin(time * 2 + i) * 6;
            const sx = cx + Math.cos(angle) * dist;
            const sy = cy + Math.sin(angle) * dist;
            this.ctx.save();
            this.ctx.fillStyle = '#FACC15';
            this.ctx.shadowColor = '#FACC15';
            this.ctx.shadowBlur = 8;
            this.drawStar(sx, sy, 4, 8, 3);
            this.ctx.restore();
        }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
    }

    drawDiamond(cx, cy, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - size);
        this.ctx.lineTo(cx + size, cy);
        this.ctx.lineTo(cx, cy + size);
        this.ctx.lineTo(cx - size, cy);
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
    }

    drawTriangle(cx, cy, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - size);
        this.ctx.lineTo(cx + size, cy + size * 0.8);
        this.ctx.lineTo(cx - size, cy + size * 0.8);
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
    }

    renderLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            this.ctx.save();
            this.ctx.strokeStyle = l.color;
            this.ctx.lineWidth = l.width;
            this.ctx.lineCap = 'round';
            this.ctx.shadowColor = l.color;
            this.ctx.shadowBlur = 24;
            this.ctx.globalAlpha = l.alpha;

            // Haz exterior
            this.ctx.beginPath();
            this.ctx.moveTo(l.x1, l.y1);
            this.ctx.lineTo(l.x2, l.y2);
            this.ctx.stroke();

            // Haz interior blanco ultra brillante
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = l.width * 0.35;
            this.ctx.stroke();

            this.ctx.restore();

            l.alpha -= 0.08;
            l.width *= 0.92;
            if (l.alpha <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }

    renderParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    renderFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.02;

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 6;
            this.ctx.font = `bold ${ft.size}px "Fredoka", sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    }

    renderHandAuras() {
        // Renderizar guantes / auras de energía sobre las manos detectadas
        ['left', 'right', 'touch'].forEach(key => {
            const cursor = this.handCursors[key];
            if (!cursor.active) return;

            const isLeft = key === 'left';
            const color = isLeft ? '#06B6D4' : (key === 'right' ? '#F97316' : '#EC4899');
            const label = isLeft ? 'MANO IZQ' : (key === 'right' ? 'MANO DER' : 'LÁSER TÁCTIL');

            this.ctx.save();
            this.ctx.translate(cursor.x, cursor.y);

            // Anillo exterior de energía
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 32, 0, Math.PI * 2);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();

            // Barra de carga si está apuntando a un objetivo
            if (cursor.charge > 0) {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cursor.charge);
                this.ctx.strokeStyle = '#FACC15';
                this.ctx.lineWidth = 6;
                this.ctx.stroke();
            }

            // Centro luminoso
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fill();

            // Etiqueta para reforzar la conciencia corporal del niño
            this.ctx.font = 'bold 12px "Fredoka", sans-serif';
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(label, 0, 48);

            this.ctx.restore();
        });
    }
}

window.astroGame = new AstroGame();
