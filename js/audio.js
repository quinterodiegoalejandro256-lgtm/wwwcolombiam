/**
 * Audio System - AstroLaser Kids
 * Utiliza Web Audio API para efectos de sonido sintetizados (sin dependencias externas)
 * y Web Speech API para la locución en español del Robot Asistente.
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.speechEnabled = true;
        this.speechRate = 1.0;
        this.synth = window.speechSynthesis || null;
        this.spanishVoice = null;

        this.initAudioContext = this.initAudioContext.bind(this);
        this.initVoice();
    }

    initAudioContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initVoice() {
        if (!this.synth) return;
        const setVoice = () => {
            const voices = this.synth.getVoices();
            // Buscar voz en español preferida
            this.spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Sabina') || v.name.includes('Helena') || v.name.includes('Paulina')))
                || voices.find(v => v.lang.startsWith('es'))
                || null;
        };

        setVoice();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = setVoice;
        }
    }

    speak(text, priority = false) {
        if (!this.speechEnabled || !this.synth) return;

        if (priority) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.spanishVoice) {
            utterance.voice = this.spanishVoice;
            utterance.lang = this.spanishVoice.lang;
        } else {
            utterance.lang = 'es-ES';
        }
        utterance.rate = this.speechRate;
        utterance.pitch = 1.15; // Tono ligeramente más amigable y alegre para niños
        utterance.volume = 0.95;

        this.synth.speak(utterance);
    }

    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    // Efecto de Disparo Láser (Synth Sci-Fi)
    playLaser(hand = 'right') {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Diferenciar ligeramente tono de mano izquierda y derecha para feedback auditivo bilateral
        const startFreq = hand === 'left' ? 880 : 980;
        const endFreq = hand === 'left' ? 120 : 150;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Efecto de Explosión / Impacto en Meteoro
    playExplosion() {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.25);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    // Efecto de Acierto / Éxito
    playSuccess() {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        });
    }

    // Efecto de Error (Amable y suave para no desmotivar a los niños)
    playError() {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    // Sonido de Carga de Rayo Láser (cuando apuntan hacia un objetivo)
    playCharge() {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Fanfarria Final de Partida
    playVictory() {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        arpeggio.forEach((f, i) => {
            const now = this.ctx.currentTime + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.45);
        });
    }

    playCountdown(isFinal = false) {
        if (!this.soundEnabled) return;
        this.initAudioContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.15));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (isFinal ? 0.4 : 0.2));
    }
}

// Instancia global
window.soundCtrl = new SoundController();
