/**
 * Pose Tracker & Computer Vision Engine
 * Maneja la captura de cámara, detección de postura con MediaPipe Pose,
 * cálculo de gestos láser, y fallback táctil para Pizarras Digitales.
 */

class PoseTracker {
    constructor() {
        this.video = null;
        this.camera = null;
        this.pose = null;
        this.isReady = false;
        this.isTracking = false;
        this.useCamera = true;
        this.isMirrored = true;

        // Sensibilidad y umbrales
        this.sensitivity = 1.0;
        this.aimHoldTime = 300; // ms requeridos para fijar blanco en modo hover
        this.thrustThreshold = 0.08; // umbral de velocidad de empuje

        // Puntos actuales de las manos
        this.leftHand = { x: 0, y: 0, rawX: 0, rawY: 0, visible: false, prevY: 0, prevX: 0, speed: 0 };
        this.rightHand = { x: 0, y: 0, rawX: 0, rawY: 0, visible: false, prevY: 0, prevX: 0, speed: 0 };
        this.nose = { x: 0, y: 0, visible: false };

        // Fallback táctil / ratón (Pizarra Digital interactiva)
        this.pointerHand = { x: 0, y: 0, active: false };

        // Callbacks
        this.onPoseResults = null;
        this.onShootLaser = null; // callback(handName, x, y, direction)

        // Estado interno de disparo
        this.lastShotTime = { left: 0, right: 0, pointer: 0 };
        this.cooldown = 400; // ms entre disparos de la misma mano
    }

    async init(videoElement) {
        this.video = videoElement;

        // Intentar inicializar MediaPipe Pose si está disponible en window.Pose
        if (typeof window.Pose !== 'undefined') {
            try {
                this.pose = new window.Pose({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
                });

                this.pose.setOptions({
                    modelComplexity: 0, // 0 = ultra rápido para pizarras y PCs escolares
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    smoothSegmentation: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                this.pose.onResults(this.handlePoseResults.bind(this));
                this.isReady = true;
                console.log("MediaPipe Pose inicializado correctamente.");
            } catch (err) {
                console.warn("No se pudo iniciar MediaPipe Pose; usando modo interactivo táctil.", err);
                this.isReady = false;
            }
        } else {
            console.warn("Script de MediaPipe Pose aún no cargado.");
        }
    }

    async startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("El navegador no soporta acceso a cámara.");
        }

        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.video.srcObject = stream;
        await this.video.play();

        if (this.pose && typeof window.Camera !== 'undefined') {
            this.camera = new window.Camera(this.video, {
                onFrame: async () => {
                    if (this.isTracking && this.video && this.video.readyState >= 2) {
                        await this.pose.send({ image: this.video });
                    }
                },
                width: 640,
                height: 480
            });
            this.camera.start();
        } else if (this.pose) {
            // Loop manual de frames si CameraUtils no está disponible
            const processFrame = async () => {
                if (this.isTracking && this.video && !this.video.paused) {
                    await this.pose.send({ image: this.video });
                }
                if (this.isTracking) {
                    requestAnimationFrame(processFrame);
                }
            };
            requestAnimationFrame(processFrame);
        }

        this.isTracking = true;
        this.useCamera = true;
    }

    stopCamera() {
        this.isTracking = false;
        if (this.camera) {
            this.camera.stop();
        }
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    handlePoseResults(results) {
        if (!results || !results.poseLandmarks) {
            this.leftHand.visible = false;
            this.rightHand.visible = false;
            if (this.onPoseResults) {
                this.onPoseResults(null);
            }
            return;
        }

        const lm = results.poseLandmarks;
        const now = performance.now();

        // Keypoints:
        // 0: Nariz
        // 11: Hombro Izq, 12: Hombro Der
        // 13: Codo Izq,   14: Codo Der
        // 15: Muñeca Izq, 16: Muñeca Der
        // 19: Dedo Izq,   20: Dedo Der
        const rawLeftWrist = lm[15];
        const rawRightWrist = lm[16];
        const rawNose = lm[0];

        // Mapear coordenadas considerando efecto espejo (indispensable para niños)
        if (rawLeftWrist && rawLeftWrist.visibility > 0.4) {
            const mappedX = this.isMirrored ? (1 - rawLeftWrist.x) : rawLeftWrist.x;
            const mappedY = rawLeftWrist.y;
            const dx = mappedX - this.leftHand.rawX;
            const dy = mappedY - this.leftHand.rawY;
            this.leftHand.speed = Math.sqrt(dx * dx + dy * dy);

            this.leftHand.rawX = mappedX;
            this.leftHand.rawY = mappedY;
            this.leftHand.visible = true;

            // Disparo por gesto o extensión rápida
            if (this.leftHand.speed > this.thrustThreshold && (now - this.lastShotTime.left) > this.cooldown) {
                this.triggerShoot('left', mappedX, mappedY);
            }
        } else {
            this.leftHand.visible = false;
        }

        if (rawRightWrist && rawRightWrist.visibility > 0.4) {
            const mappedX = this.isMirrored ? (1 - rawRightWrist.x) : rawRightWrist.x;
            const mappedY = rawRightWrist.y;
            const dx = mappedX - this.rightHand.rawX;
            const dy = mappedY - this.rightHand.rawY;
            this.rightHand.speed = Math.sqrt(dx * dx + dy * dy);

            this.rightHand.rawX = mappedX;
            this.rightHand.rawY = mappedY;
            this.rightHand.visible = true;

            // Disparo por gesto o extensión rápida
            if (this.rightHand.speed > this.thrustThreshold && (now - this.lastShotTime.right) > this.cooldown) {
                this.triggerShoot('right', mappedX, mappedY);
            }
        } else {
            this.rightHand.visible = false;
        }

        if (rawNose && rawNose.visibility > 0.4) {
            this.nose.x = this.isMirrored ? (1 - rawNose.x) : rawNose.x;
            this.nose.y = rawNose.y;
            this.nose.visible = true;
        }

        if (this.onPoseResults) {
            this.onPoseResults({
                leftHand: this.leftHand,
                rightHand: this.rightHand,
                nose: this.nose,
                landmarks: lm,
                image: results.image
            });
        }
    }

    triggerShoot(handName, normX, normY) {
        this.lastShotTime[handName] = performance.now();
        if (this.onShootLaser) {
            this.onShootLaser(handName, normX, normY);
        }
    }

    // Soporte para interacción táctil en Pizarras Digitales (Smart Boards)
    handleTouchOrClick(normX, normY) {
        const now = performance.now();
        if (now - this.lastShotTime.pointer > 200) {
            this.lastShotTime.pointer = now;
            this.pointerHand.x = normX;
            this.pointerHand.y = normY;
            this.pointerHand.active = true;
            if (this.onShootLaser) {
                this.onShootLaser('touch', normX, normY);
            }
        }
    }
}

window.poseTracker = new PoseTracker();
