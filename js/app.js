/**
 * AstroLaser Kids - Controlador Principal de la Aplicación (App Controller)
 * Conecta la interfaz de usuario, eventos, navegación, reportes,
 * calibración de cámara y gestión de estudiantes.
 */

class AppController {
    constructor() {
        this.activeTab = 'game';
        this.selectedStudent = null;
        this.selectedMode = 'directions';
        this.selectedDifficulty = 'normal';
        this.selectedGroupId = 'all';
        this.selectedReportStudentId = 'all';

        this.init();
    }

    init() {
        // Inicializar componentes
        window.astroGame.init(document.getElementById('game-canvas'));
        
        // Asignar estudiante por defecto
        const students = window.reportsManager.getStudentsByGroup('g1');
        if (students.length > 0) {
            this.selectedStudent = students[0];
        }

        this.setupNavigation();
        this.setupGameEvents();
        this.setupReportsEvents();
        this.setupManagementEvents();
        this.setupModals();
        this.updateHUDInfo();
        this.renderReportsView();

        // Inicializar cámara de fondo
        this.initCamera();
    }

    async initCamera() {
        const videoEl = document.getElementById('webcam-video');
        await window.poseTracker.init(videoEl);
        
        try {
            await window.poseTracker.startCamera();
            this.updateCameraStatusUI(true);
        } catch (err) {
            console.log("Cámara no iniciada automáticamente o bloqueada por permisos. Modo táctil activo para Pizarra Digital.", err);
            this.updateCameraStatusUI(false);
        }
    }

    updateCameraStatusUI(isActive) {
        const statusBadge = document.getElementById('camera-status-badge');
        const statusText = document.getElementById('camera-status-text');
        if (statusBadge && statusText) {
            if (isActive) {
                statusBadge.style.color = '#10B981';
                statusText.textContent = 'CÁMARA ACTIVA (MOVIMIENTO)';
            } else {
                statusBadge.style.color = '#F59E0B';
                statusText.textContent = 'MODO TÁCTIL (PIZARRA DIGITAL)';
            }
        }
    }

    setupNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Botón Pantalla Completa (Pizarra Digital)
        const fullscreenBtn = document.getElementById('btn-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(e => console.log(e));
                } else {
                    document.exitFullscreen().catch(e => console.log(e));
                }
            });
        }

        // Botón Sonido y Voz
        const soundBtn = document.getElementById('btn-toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                window.soundCtrl.soundEnabled = !window.soundCtrl.soundEnabled;
                window.soundCtrl.speechEnabled = !window.soundCtrl.speechEnabled;
                soundBtn.textContent = window.soundCtrl.soundEnabled ? '🔊' : '🔇';
            });
        }
    }

    switchTab(tabName) {
        this.activeTab = tabName;

        // Actualizar pestañas activas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Actualizar vistas
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.toggle('active', view.id === `${tabName}-view`);
        });

        // Si entramos a reportes, refrescar gráficos y datos
        if (tabName === 'reports') {
            this.renderReportsView();
        } else if (tabName === 'management') {
            this.renderManagementView();
        } else if (tabName === 'game') {
            window.astroGame.resize();
        }
    }

    setupGameEvents() {
        // Botón Jugar / Iniciar Misión
        const playBtn = document.getElementById('btn-play-game');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.openGameSetupModal();
            });
        }

        // HUD Callback
        window.astroGame.onUpdateHUD = () => {
            const scoreEl = document.getElementById('hud-score');
            const comboEl = document.getElementById('hud-combo');
            const timeEl = document.getElementById('hud-time');
            const promptTitleEl = document.getElementById('hud-prompt-title');
            const promptSubEl = document.getElementById('hud-prompt-sub');

            if (scoreEl) scoreEl.textContent = window.astroGame.score;
            if (comboEl) comboEl.textContent = `x${window.astroGame.combo}`;
            if (timeEl) timeEl.textContent = `${window.astroGame.timeLeft}s`;
            if (promptTitleEl) promptTitleEl.textContent = window.astroGame.promptText || '¡PREPARADOS!';
            if (promptSubEl) promptSubEl.textContent = window.astroGame.promptSubtext || 'Mueve tus brazos hacia el objetivo';
        };

        // Game Over Callback
        window.astroGame.onGameOver = (summary) => {
            this.showVictoryModal(summary);
        };

        // Botón alternar cámara
        const toggleCamBtn = document.getElementById('btn-toggle-camera');
        if (toggleCamBtn) {
            toggleCamBtn.addEventListener('click', async () => {
                if (window.poseTracker.isTracking) {
                    window.poseTracker.stopCamera();
                    this.updateCameraStatusUI(false);
                    toggleCamBtn.textContent = '📷 Activar Cámara';
                } else {
                    try {
                        await window.poseTracker.startCamera();
                        this.updateCameraStatusUI(true);
                        toggleCamBtn.textContent = '🛑 Detener Cámara';
                    } catch (e) {
                        alert("No se pudo iniciar la cámara web. Asegúrate de permitir los permisos en el navegador.");
                    }
                }
            });
        }
    }

    updateHUDInfo() {
        const avatarEl = document.getElementById('hud-student-avatar');
        const nameEl = document.getElementById('hud-student-name');
        const groupEl = document.getElementById('hud-student-group');

        if (this.selectedStudent) {
            if (avatarEl) avatarEl.textContent = this.selectedStudent.avatar;
            if (nameEl) nameEl.textContent = this.selectedStudent.name;
            const group = window.reportsManager.getGroups().find(g => g.id === this.selectedStudent.groupId);
            if (groupEl) groupEl.textContent = group ? group.name : 'Estudiante Activo';
        } else {
            if (avatarEl) avatarEl.textContent = '🚀';
            if (nameEl) nameEl.textContent = 'Astronauta Invitado';
            if (groupEl) groupEl.textContent = 'Sesión Libre';
        }
    }

    openGameSetupModal() {
        const modal = document.getElementById('setup-modal');
        if (!modal) return;

        // Renderizar lista de estudiantes en el modal
        const studentListContainer = document.getElementById('modal-student-list');
        const students = window.reportsManager.getStudentsByGroup('all');

        studentListContainer.innerHTML = students.map(s => `
            <div class="student-picker-item ${this.selectedStudent && this.selectedStudent.id === s.id ? 'selected' : ''}" data-student-id="${s.id}">
                <div class="student-info">
                    <span class="student-avatar">${s.avatar}</span>
                    <span class="student-name">${s.name} (${s.age} años)</span>
                </div>
                <span>${this.selectedStudent && this.selectedStudent.id === s.id ? '✓' : ''}</span>
            </div>
        `).join('');

        // Eventos de selección de estudiante
        studentListContainer.querySelectorAll('.student-picker-item').forEach(item => {
            item.addEventListener('click', () => {
                const sId = item.dataset.studentId;
                this.selectedStudent = window.reportsManager.getStudentById(sId);
                this.openGameSetupModal(); // volver a renderizar selección
                this.updateHUDInfo();
            });
        });

        // Eventos de selección de modo
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.mode === this.selectedMode);
            card.onclick = () => {
                this.selectedMode = card.dataset.mode;
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            };
        });

        // Eventos de dificultad
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.diff === this.selectedDifficulty);
            btn.onclick = () => {
                this.selectedDifficulty = btn.dataset.diff;
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            };
        });

        modal.classList.add('active');
    }

    startGameFromModal() {
        const modal = document.getElementById('setup-modal');
        if (modal) modal.classList.remove('active');

        this.switchTab('game');
        this.updateHUDInfo();

        const duration = parseInt(document.getElementById('select-game-duration').value) || 60;
        window.astroGame.startSession(this.selectedStudent, this.selectedMode, duration, this.selectedDifficulty);
    }

    showVictoryModal(summary) {
        const modal = document.getElementById('victory-modal');
        if (!modal) return;

        document.getElementById('victory-score-num').textContent = summary.score;
        document.getElementById('victory-accuracy').textContent = `${summary.accuracy}%`;
        document.getElementById('victory-combo').textContent = `x${summary.maxCombo}`;
        document.getElementById('victory-reaction').textContent = `${summary.avgReactionTime} ms`;

        modal.classList.add('active');
    }

    setupModals() {
        // Cerrar modal al pulsar botones de cerrar
        document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            });
        });

        // Iniciar juego desde modal
        const startBtn = document.getElementById('btn-confirm-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGameFromModal());
        }

        // Botón repetir en modal de victoria
        const retryBtn = document.getElementById('btn-victory-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                document.getElementById('victory-modal').classList.remove('active');
                window.astroGame.startSession(this.selectedStudent, this.selectedMode, 60, this.selectedDifficulty);
            });
        }

        // Botón ir a reportes en modal de victoria
        const viewReportBtn = document.getElementById('btn-victory-report');
        if (viewReportBtn) {
            viewReportBtn.addEventListener('click', () => {
                document.getElementById('victory-modal').classList.remove('active');
                if (this.selectedStudent) {
                    this.selectedReportStudentId = this.selectedStudent.id;
                }
                this.switchTab('reports');
            });
        }
    }

    /* ==========================================================================
       SECCIÓN DE REPORTES Y ANALÍTICAS
       ========================================================================== */
    setupReportsEvents() {
        const groupFilter = document.getElementById('filter-report-group');
        const studentFilter = document.getElementById('filter-report-student');

        if (groupFilter) {
            groupFilter.addEventListener('change', (e) => {
                this.selectedGroupId = e.target.value;
                this.populateStudentFilter();
                this.renderReportsView();
            });
        }

        if (studentFilter) {
            studentFilter.addEventListener('change', (e) => {
                this.selectedReportStudentId = e.target.value;
                this.renderReportsView();
            });
        }

        // Botón Imprimir / PDF
        const printBtn = document.getElementById('btn-print-report');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Botón Exportar JSON
        const exportBtn = document.getElementById('btn-export-json');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                window.reportsManager.exportJSON();
            });
        }
    }

    populateStudentFilter() {
        const studentFilter = document.getElementById('filter-report-student');
        if (!studentFilter) return;

        const students = window.reportsManager.getStudentsByGroup(this.selectedGroupId);
        let html = '<option value="all">👥 Vista General del Grupo</option>';
        students.forEach(s => {
            html += `<option value="${s.id}" ${this.selectedReportStudentId === s.id ? 'selected' : ''}>${s.avatar} ${s.name}</option>`;
        });
        studentFilter.innerHTML = html;
    }

    renderReportsView() {
        // Cargar grupos en el selector si no están cargados
        const groupFilter = document.getElementById('filter-report-group');
        if (groupFilter && groupFilter.options.length <= 1) {
            const groups = window.reportsManager.getGroups();
            let gHtml = '<option value="all">Todos los Grupos</option>';
            groups.forEach(g => {
                gHtml += `<option value="${g.id}">${g.name}</option>`;
            });
            groupFilter.innerHTML = gHtml;
        }

        this.populateStudentFilter();

        const isIndividual = this.selectedReportStudentId !== 'all';
        if (isIndividual) {
            this.renderIndividualStudentReport(this.selectedReportStudentId);
        } else {
            this.renderGroupReport(this.selectedGroupId);
        }
    }

    renderGroupReport(groupId) {
        const stats = window.reportsManager.getGroupStats(groupId);

        // Actualizar Métricas Superiores
        document.getElementById('report-stat-total-students').textContent = stats.studentsCount;
        document.getElementById('report-stat-accuracy').textContent = `${stats.avgAccuracy}%`;
        document.getElementById('report-stat-reaction').textContent = `${stats.avgReaction} ms`;
        document.getElementById('report-stat-sessions').textContent = stats.totalSessionsCount;

        // Renderizar Barras de Dominio de Direcciones
        const dirsContainer = document.getElementById('report-direction-bars');
        const dirs = [
            { key: 'left',  name: 'IZQUIERDA', color: '#06B6D4', val: stats.directionalMastery.left },
            { key: 'right', name: 'DERECHA',   color: '#F97316', val: stats.directionalMastery.right },
            { key: 'up',    name: 'ARRIBA',    color: '#FACC15', val: stats.directionalMastery.up },
            { key: 'down',  name: 'ABAJO',     color: '#A855F7', val: stats.directionalMastery.down }
        ];

        dirsContainer.innerHTML = dirs.map(d => `
            <div class="dir-bar-row">
                <div class="dir-bar-header">
                    <span style="color: ${d.color};">${d.name}</span>
                    <span>${d.val}% de Acierto</span>
                </div>
                <div class="dir-bar-track">
                    <div class="dir-bar-fill" style="width: ${d.val}%; background: ${d.color};"></div>
                </div>
            </div>
        `).join('');

        // Renderizar Diagnóstico y Recomendaciones Grupales
        const tipsContainer = document.getElementById('report-pedagogical-tips');
        tipsContainer.innerHTML = `
            <div class="tip-card info">
                <div class="tip-title">📋 Diagnóstico Global del Aula</div>
                <div class="tip-text">${stats.groupDiagnosis}</div>
            </div>
            <div class="tip-card success">
                <div class="tip-title">🎯 Sugerencia de Intervención en Pizarra Digital</div>
                <div class="tip-text">Realizar sesiones colectivas en modo "Brújula Espacial" donde dos niños se turnen para ejecutar la orden verbal guiando sus brazos hacia las zonas señaladas.</div>
            </div>
        `;

        // Renderizar Tabla de Estudiantes
        const tableBody = document.getElementById('report-students-table-body');
        tableBody.innerHTML = stats.studentRankings.map(r => `
            <tr style="cursor: pointer;" onclick="window.appCtrl.selectStudentForReport('${r.student.id}')">
                <td><span style="font-size: 1.4rem;">${r.student.avatar}</span> <strong>${r.student.name}</strong></td>
                <td>${r.student.age} años</td>
                <td><strong style="color: ${r.stats.overallAccuracy >= 80 ? '#10B981' : (r.stats.overallAccuracy >= 60 ? '#F59E0B' : '#EF4444')}">${r.stats.overallAccuracy}%</strong></td>
                <td>${r.stats.avgReactionTime} ms</td>
                <td>
                    <span style="color: #06B6D4;">Izq: ${r.stats.directionalAccuracy.left}%</span> | 
                    <span style="color: #F97316;">Der: ${r.stats.directionalAccuracy.right}%</span>
                </td>
                <td>${r.stats.totalSessions}</td>
            </tr>
        `).join('');
    }

    selectStudentForReport(studentId) {
        this.selectedReportStudentId = studentId;
        const studentFilter = document.getElementById('filter-report-student');
        if (studentFilter) studentFilter.value = studentId;
        this.renderIndividualStudentReport(studentId);
    }

    renderIndividualStudentReport(studentId) {
        const stats = window.reportsManager.getStudentStats(studentId);
        if (!stats) return;

        // Actualizar Métricas Superiores con los datos individuales del estudiante
        document.getElementById('report-stat-total-students').textContent = `1 (${stats.student.name})`;
        document.getElementById('report-stat-accuracy').textContent = `${stats.overallAccuracy}%`;
        document.getElementById('report-stat-reaction').textContent = `${stats.avgReactionTime} ms`;
        document.getElementById('report-stat-sessions').textContent = stats.totalSessions;

        // Renderizar Barras Direccionales Individuales
        const dirsContainer = document.getElementById('report-direction-bars');
        const dirs = [
            { key: 'left',  name: 'IZQUIERDA', color: '#06B6D4', val: stats.directionalAccuracy.left,  time: stats.directionalReactionTime ? stats.directionalReactionTime.left : 0 },
            { key: 'right', name: 'DERECHA',   color: '#F97316', val: stats.directionalAccuracy.right, time: stats.directionalReactionTime ? stats.directionalReactionTime.right : 0 },
            { key: 'up',    name: 'ARRIBA',    color: '#FACC15', val: stats.directionalAccuracy.up,    time: stats.directionalReactionTime ? stats.directionalReactionTime.up : 0 },
            { key: 'down',  name: 'ABAJO',     color: '#A855F7', val: stats.directionalAccuracy.down,  time: stats.directionalReactionTime ? stats.directionalReactionTime.down : 0 }
        ];

        dirsContainer.innerHTML = `
            <div style="margin-bottom: 8px; color: var(--color-primary); font-weight: bold;">
                Perfil de Lateralidad y Orientación de ${stats.student.name}
            </div>
            ${dirs.map(d => `
                <div class="dir-bar-row">
                    <div class="dir-bar-header">
                        <span style="color: ${d.color};">${d.name}</span>
                        <span>${d.val}% acierto ${d.time > 0 ? `(${d.time}ms)` : ''}</span>
                    </div>
                    <div class="dir-bar-track">
                        <div class="dir-bar-fill" style="width: ${d.val}%; background: ${d.color};"></div>
                    </div>
                </div>
            `).join('')}
        `;

        // Renderizar Recomendaciones Pedagógicas Específicas
        const tipsContainer = document.getElementById('report-pedagogical-tips');
        tipsContainer.innerHTML = stats.recommendations.map(tip => `
            <div class="tip-card ${tip.type}">
                <div class="tip-title">${tip.title}</div>
                <div class="tip-text">${tip.text}</div>
            </div>
        `).join('');

        // Renderizar Historial de Sesiones del Estudiante
        const tableBody = document.getElementById('report-students-table-body');
        tableBody.innerHTML = stats.sessions.map((s, idx) => `
            <tr>
                <td>Sesión #${stats.sessions.length - idx} (${new Date(s.date).toLocaleDateString()})</td>
                <td>Modo: ${s.mode}</td>
                <td><strong style="color: #10B981">${s.accuracy}%</strong></td>
                <td>${s.avgReactionTime} ms</td>
                <td>
                    <span style="color: #06B6D4;">Izq: ${s.directionalBreakdown.left.accuracy}%</span> | 
                    <span style="color: #F97316;">Der: ${s.directionalBreakdown.right.accuracy}%</span>
                </td>
                <td>Puntaje: ${s.score}</td>
            </tr>
        `).join('');
    }

    /* ==========================================================================
       GESTIÓN DE ESTUDIANTES Y AULAS
       ========================================================================== */
    setupManagementEvents() {
        const addStudentBtn = document.getElementById('btn-add-student');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => {
                const name = document.getElementById('input-student-name').value.trim();
                const age = document.getElementById('input-student-age').value.trim();
                const group = document.getElementById('input-student-group').value;
                const avatar = document.getElementById('input-student-avatar').value || '🚀';
                const notes = document.getElementById('input-student-notes').value.trim();

                if (!name) {
                    alert("Por favor escribe el nombre del estudiante.");
                    return;
                }

                window.reportsManager.addStudent(group, name, age, avatar, notes);
                alert(`¡Estudiante ${name} registrado con éxito!`);

                document.getElementById('input-student-name').value = '';
                document.getElementById('input-student-notes').value = '';

                this.renderManagementView();
            });
        }
    }

    renderManagementView() {
        const groupSelect = document.getElementById('input-student-group');
        if (groupSelect) {
            const groups = window.reportsManager.getGroups();
            groupSelect.innerHTML = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        }

        const studentList = document.getElementById('management-student-list');
        if (studentList) {
            const students = window.reportsManager.getStudentsByGroup('all');
            studentList.innerHTML = students.map(s => `
                <div class="stat-card" style="justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="font-size: 2rem;">${s.avatar}</span>
                        <div>
                            <div style="font-weight: 700; font-size: 1.1rem;">${s.name}</div>
                            <div style="color: var(--text-muted); font-size: 0.85rem;">${s.age} años - ${s.notes || 'Sin notas'}</div>
                        </div>
                    </div>
                    <button class="action-btn" style="color: #EF4444; border-color: rgba(239, 68, 68, 0.3);" onclick="window.appCtrl.deleteStudent('${s.id}')">
                        🗑️ Eliminar
                    </button>
                </div>
            `).join('');
        }
    }

    deleteStudent(studentId) {
        if (confirm("¿Estás seguro de eliminar este estudiante y todo su historial de reportes?")) {
            window.reportsManager.deleteStudent(studentId);
            this.renderManagementView();
            this.renderReportsView();
        }
    }
}

// Inicializar controlador cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    window.appCtrl = new AppController();
});
