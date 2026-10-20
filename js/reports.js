/**
 * Reports & Student Management Engine - AstroLaser Kids
 * Maneja perfiles de estudiantes, grupos escolares, historial de sesiones,
 * cálculo de analíticas cognitivas (lateralidad, atención, memoria) y exportación.
 */

class ReportsManager {
    constructor() {
        this.STORAGE_KEY = 'astrolaser_kids_db_v1';
        this.data = {
            groups: [],
            students: [],
            sessions: []
        };
        this.loadDatabase();
    }

    loadDatabase() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
            } catch (e) {
                console.error("Error al leer datos locales, inicializando por defecto.", e);
                this.initializeDefaultData();
            }
        } else {
            this.initializeDefaultData();
        }
    }

    saveDatabase() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    initializeDefaultData() {
        // Datos de ejemplo iniciales para que el profesor/terapeuta pueda ver reportes completos de inmediato
        this.data = {
            groups: [
                { id: 'g1', name: '1º Primaria - Grupo A', grade: '1º', notes: 'Aula de psicomotricidad y refuerzo de lateralidad' },
                { id: 'g2', name: 'Preescolar - Los Exploradores', grade: 'Preescolar', notes: 'Desarrollo de nociones espaciales básicas' }
            ],
            students: [
                { id: 's1', groupId: 'g1', name: 'Mateo González', age: 6, avatar: '🚀', notes: 'Buen entusiasmo. Tiende a dudar levemente entre izquierda y derecha.' },
                { id: 's2', groupId: 'g1', name: 'Sofía Ramirez', age: 7, avatar: '⭐', notes: 'Excelente coordinación motriz y velocidad de reacción.' },
                { id: 's3', groupId: 'g1', name: 'Lucas Valenzuela', age: 6, avatar: '🤖', notes: 'Requiere apoyo en lateralidad izquierda y concentración sostenida.' },
                { id: 's4', groupId: 'g1', name: 'Valentina Castro', age: 7, avatar: '👾', notes: 'Muy buena memoria secuencial y discriminación visual.' },
                { id: 's5', groupId: 'g2', name: 'Thiago Herrera', age: 5, avatar: '🪐', notes: 'Iniciando reconocimiento de arriba y abajo.' }
            ],
            sessions: []
        };

        // Generar sesiones realistas para Mateo, Sofía y Lucas
        this.seedDemoSessions();
        this.saveDatabase();
    }

    seedDemoSessions() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // Mateo: Buen rendimiento, pero menor precisión en Izquierda
        this.data.sessions.push({
            id: 'sess_1',
            studentId: 's1',
            date: new Date(now - 3 * oneDay).toISOString(),
            mode: 'directions',
            difficulty: 'normal',
            score: 1250,
            maxCombo: 6,
            totalTrials: 14,
            correctTrials: 11,
            accuracy: 79,
            avgReactionTime: 1420,
            directionalBreakdown: {
                left:  { total: 4, accuracy: 50, avgTime: 1750 },
                right: { total: 4, accuracy: 100, avgTime: 1200 },
                up:    { total: 3, accuracy: 100, avgTime: 1100 },
                down:  { total: 3, accuracy: 67, avgTime: 1450 }
            }
        });
        this.data.sessions.push({
            id: 'sess_2',
            studentId: 's1',
            date: new Date(now - 1 * oneDay).toISOString(),
            mode: 'directions',
            difficulty: 'normal',
            score: 1600,
            maxCombo: 8,
            totalTrials: 16,
            correctTrials: 14,
            accuracy: 88,
            avgReactionTime: 1280,
            directionalBreakdown: {
                left:  { total: 5, accuracy: 80, avgTime: 1400 },
                right: { total: 4, accuracy: 100, avgTime: 1150 },
                up:    { total: 4, accuracy: 100, avgTime: 1050 },
                down:  { total: 3, accuracy: 67, avgTime: 1300 }
            }
        });

        // Sofía: Rendimiento alto en todas las direcciones
        this.data.sessions.push({
            id: 'sess_3',
            studentId: 's2',
            date: new Date(now - 2 * oneDay).toISOString(),
            mode: 'colors_shapes',
            difficulty: 'normal',
            score: 2100,
            maxCombo: 12,
            totalTrials: 18,
            correctTrials: 17,
            accuracy: 94,
            avgReactionTime: 950,
            directionalBreakdown: {
                left:  { total: 4, accuracy: 100, avgTime: 920 },
                right: { total: 5, accuracy: 100, avgTime: 890 },
                up:    { total: 5, accuracy: 100, avgTime: 860 },
                down:  { total: 4, accuracy: 75,  avgTime: 1050 }
            }
        });

        // Lucas: Marcada dificultad en Izquierda (40% acierto)
        this.data.sessions.push({
            id: 'sess_4',
            studentId: 's3',
            date: new Date(now - 2 * oneDay).toISOString(),
            mode: 'directions',
            difficulty: 'easy',
            score: 750,
            maxCombo: 3,
            totalTrials: 12,
            correctTrials: 7,
            accuracy: 58,
            avgReactionTime: 2100,
            directionalBreakdown: {
                left:  { total: 4, accuracy: 25, avgTime: 2500 },
                right: { total: 3, accuracy: 67, avgTime: 1900 },
                up:    { total: 3, accuracy: 100, avgTime: 1600 },
                down:  { total: 2, accuracy: 50, avgTime: 2200 }
            }
        });
    }

    // Métodos para Grupos
    getGroups() {
        return this.data.groups;
    }

    addGroup(name, grade = '1º', notes = '') {
        const id = 'g_' + Date.now();
        const newGroup = { id, name, grade, notes };
        this.data.groups.push(newGroup);
        this.saveDatabase();
        return newGroup;
    }

    // Métodos para Estudiantes
    getStudentsByGroup(groupId) {
        if (!groupId || groupId === 'all') return this.data.students;
        return this.data.students.filter(s => s.groupId === groupId);
    }

    getStudentById(id) {
        return this.data.students.find(s => s.id === id);
    }

    addStudent(groupId, name, age, avatar = '🚀', notes = '') {
        const id = 's_' + Date.now();
        const newStudent = { id, groupId, name, age: parseInt(age) || 6, avatar, notes };
        this.data.students.push(newStudent);
        this.saveDatabase();
        return newStudent;
    }

    deleteStudent(studentId) {
        this.data.students = this.data.students.filter(s => s.id !== studentId);
        this.data.sessions = this.data.sessions.filter(sess => sess.studentId !== studentId);
        this.saveDatabase();
    }

    // Registro de Sesión completada
    saveSessionReport(studentId, sessionData) {
        const record = {
            id: 'sess_' + Date.now(),
            studentId,
            ...sessionData
        };
        this.data.sessions.push(record);
        this.saveDatabase();
        return record;
    }

    getSessionsByStudent(studentId) {
        return this.data.sessions.filter(s => s.studentId === studentId).sort((a,b) => new Date(b.date) - new Date(a.date));
    }

    // Análisis Cognitivo y Estadísticas de un Estudiante
    getStudentStats(studentId) {
        const student = this.getStudentById(studentId);
        if (!student) return null;

        const sessions = this.getSessionsByStudent(studentId);
        if (sessions.length === 0) {
            return {
                student,
                hasSessions: false,
                totalSessions: 0,
                overallAccuracy: 0,
                avgReactionTime: 0,
                bestScore: 0,
                directionalAccuracy: { left: 0, right: 0, up: 0, down: 0 },
                pedagogicalRecommendations: ["Aún no se han registrado sesiones para este estudiante. Inicia una partida para generar su diagnóstico inicial."]
            };
        }

        const totalSessions = sessions.length;
        const totalTrials = sessions.reduce((acc, s) => acc + (s.totalTrials || 0), 0);
        const correctTrials = sessions.reduce((acc, s) => acc + (s.correctTrials || 0), 0);
        const overallAccuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;
        const bestScore = Math.max(...sessions.map(s => s.score || 0));

        // Promedio de tiempo de reacción
        const validTimes = sessions.map(s => s.avgReactionTime).filter(t => t > 0);
        const avgReactionTime = validTimes.length > 0 ? Math.round(validTimes.reduce((a,b)=>a+b,0) / validTimes.length) : 0;

        // Desglose Direccional Acumulado (Izquierda, Derecha, Arriba, Abajo)
        const dirs = {
            left:  { trials: 0, correct: 0, totalTime: 0, hits: 0 },
            right: { trials: 0, correct: 0, totalTime: 0, hits: 0 },
            up:    { trials: 0, correct: 0, totalTime: 0, hits: 0 },
            down:  { trials: 0, correct: 0, totalTime: 0, hits: 0 }
        };

        sessions.forEach(sess => {
            if (sess.directionalBreakdown) {
                ['left', 'right', 'up', 'down'].forEach(d => {
                    const info = sess.directionalBreakdown[d];
                    if (info && info.total > 0) {
                        dirs[d].trials += info.total;
                        dirs[d].correct += Math.round((info.accuracy / 100) * info.total);
                        if (info.avgTime > 0) {
                            dirs[d].totalTime += info.avgTime;
                            dirs[d].hits++;
                        }
                    }
                });
            }
        });

        const directionalAccuracy = {
            left: dirs.left.trials > 0 ? Math.round((dirs.left.correct / dirs.left.trials) * 100) : 0,
            right: dirs.right.trials > 0 ? Math.round((dirs.right.correct / dirs.right.trials) * 100) : 0,
            up: dirs.up.trials > 0 ? Math.round((dirs.up.correct / dirs.up.trials) * 100) : 0,
            down: dirs.down.trials > 0 ? Math.round((dirs.down.correct / dirs.down.trials) * 100) : 0
        };

        const directionalReactionTime = {
            left: dirs.left.hits > 0 ? Math.round(dirs.left.totalTime / dirs.left.hits) : 0,
            right: dirs.right.hits > 0 ? Math.round(dirs.right.totalTime / dirs.right.hits) : 0,
            up: dirs.up.hits > 0 ? Math.round(dirs.up.totalTime / dirs.up.hits) : 0,
            down: dirs.down.hits > 0 ? Math.round(dirs.down.totalTime / dirs.down.hits) : 0
        };

        // Generar Recomendaciones Pedagógicas Automáticas
        const recommendations = this.generatePedagogicalTips(directionalAccuracy, avgReactionTime, overallAccuracy);

        return {
            student,
            hasSessions: true,
            totalSessions,
            totalTrials,
            overallAccuracy,
            avgReactionTime,
            bestScore,
            directionalAccuracy,
            directionalReactionTime,
            sessions,
            recommendations
        };
    }

    // Estadísticas Grupales (Para un grupo entero o aula)
    getGroupStats(groupId) {
        const students = this.getStudentsByGroup(groupId);
        const group = this.data.groups.find(g => g.id === groupId) || { name: 'Todos los Grupos' };

        if (students.length === 0) {
            return {
                group,
                studentsCount: 0,
                hasData: false,
                avgAccuracy: 0,
                directionalMastery: { left: 0, right: 0, up: 0, down: 0 }
            };
        }

        let totalSessionsCount = 0;
        let sumAccuracy = 0;
        let sumReactionTime = 0;
        let dirSums = { left: 0, right: 0, up: 0, down: 0 };
        let activeStudents = 0;

        const studentRankings = students.map(st => {
            const stats = this.getStudentStats(st.id);
            if (stats.hasSessions) {
                totalSessionsCount += stats.totalSessions;
                sumAccuracy += stats.overallAccuracy;
                sumReactionTime += stats.avgReactionTime;
                dirSums.left += stats.directionalAccuracy.left;
                dirSums.right += stats.directionalAccuracy.right;
                dirSums.up += stats.directionalAccuracy.up;
                dirSums.down += stats.directionalAccuracy.down;
                activeStudents++;
            }
            return {
                student: st,
                stats
            };
        });

        // Ordenar por precisión
        studentRankings.sort((a,b) => (b.stats.overallAccuracy || 0) - (a.stats.overallAccuracy || 0));

        const avgAccuracy = activeStudents > 0 ? Math.round(sumAccuracy / activeStudents) : 0;
        const avgReaction = activeStudents > 0 ? Math.round(sumReactionTime / activeStudents) : 0;

        const directionalMastery = {
            left:  activeStudents > 0 ? Math.round(dirSums.left / activeStudents) : 0,
            right: activeStudents > 0 ? Math.round(dirSums.right / activeStudents) : 0,
            up:    activeStudents > 0 ? Math.round(dirSums.up / activeStudents) : 0,
            down:  activeStudents > 0 ? Math.round(dirSums.down / activeStudents) : 0
        };

        // Identificar áreas de fortaleza y de oportunidad del grupo
        let groupDiagnosis = "";
        if (activeStudents === 0) {
            groupDiagnosis = "No hay sesiones registradas en este grupo aún.";
        } else {
            const lowestDir = Object.keys(directionalMastery).reduce((a, b) => directionalMastery[a] < directionalMastery[b] ? a : b);
            const dirNames = { left: 'IZQUIERDA', right: 'DERECHA', up: 'ARRIBA', down: 'ABAJO' };
            groupDiagnosis = `El grupo muestra mayor dominio en ${directionalMastery.up >= 80 ? 'ARRIBA y ' : ''}DERECHA (${directionalMastery.right}%). El área clave a reforzar de forma colectiva es ${dirNames[lowestDir]} (${directionalMastery[lowestDir]}% de precisión).`;
        }

        return {
            group,
            studentsCount: students.length,
            activeStudents,
            totalSessionsCount,
            hasData: activeStudents > 0,
            avgAccuracy,
            avgReaction,
            directionalMastery,
            groupDiagnosis,
            studentRankings
        };
    }

    generatePedagogicalTips(directionalAccuracy, avgReactionTime, overallAccuracy) {
        const tips = [];

        // Análisis específico de Lateralidad (Izquierda vs Derecha)
        if (directionalAccuracy.left < 70 && directionalAccuracy.right >= 75) {
            tips.push({
                type: 'warning',
                title: 'Refuerzo de Lateralidad Izquierda Requerido',
                text: 'El estudiante acierta con facilidad hacia la derecha pero muestra dudas notorias hacia la izquierda. Se sugiere realizar dinámicas psicomotrices con pulseras distintivas en la muñeca izquierda y juegos en espejo.'
            });
        } else if (directionalAccuracy.right < 70 && directionalAccuracy.left >= 75) {
            tips.push({
                type: 'warning',
                title: 'Refuerzo de Lateralidad Derecha Requerido',
                text: 'Presenta confusión al identificar la orientación derecha. Promover actividades lúdicas con la mano dominante o la extremidad derecha.'
            });
        } else if (directionalAccuracy.left < 70 && directionalAccuracy.right < 70) {
            tips.push({
                type: 'alert',
                title: 'Consolidación de Nociones Laterales (Bilateral)',
                text: 'Se observa inconsistencia general en la discriminación de izquierda y derecha. Recomendado: Jugar en modo "Brújula Espacial" a velocidad reducida con el apoyo visual de las flechas luminosas.'
            });
        } else {
            tips.push({
                type: 'success',
                title: 'Excelente Dominio de Lateralidad',
                text: 'Demuestra una sólida comprensión de las coordenadas espaciales izquierda y derecha, respondiendo con agilidad corporal.'
            });
        }

        // Análisis de Verticalidad (Arriba vs Abajo)
        if (directionalAccuracy.down < 70) {
            tips.push({
                type: 'info',
                title: 'Atención a Zona Inferior (Abajo)',
                text: 'Suele costar más inclinar la postura o apuntar con los brazos hacia abajo. Estimular flexión de rodillas y coordinación viso-motora baja.'
            });
        }

        // Análisis de Velocidad de Procesamiento y Reflejos
        if (avgReactionTime > 1800) {
            tips.push({
                type: 'info',
                title: 'Estimulación del Tiempo de Reacción',
                text: 'Tiempo de respuesta algo pausado (>1.8s). Dar tiempo de adaptación sin presionarlo; la velocidad mejorará progresivamente tras 3-4 sesiones.'
            });
        } else if (avgReactionTime < 1100 && overallAccuracy >= 80) {
            tips.push({
                type: 'star',
                title: 'Reflejos Sobresalientes',
                text: 'Gran rapidez psicomotriz y capacidad de inhibición. Listo para retos más complejos como la "Secuencia Cósmica" o el "Reactor Numérico".'
            });
        }

        return tips;
    }

    // Exportación e Importación de datos (Backup escolar)
    exportJSON() {
        const jsonStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AstroLaser_Reportes_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (parsed.students && parsed.groups) {
                this.data = parsed;
                this.saveDatabase();
                return true;
            }
        } catch (e) {
            console.error("Error al importar base de datos JSON", e);
        }
        return false;
    }
}

window.reportsManager = new ReportsManager();
