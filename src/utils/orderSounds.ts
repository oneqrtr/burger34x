import type { NotificationSoundKey } from '../types';

function playOscillator(freq: number, duration: number, type: OscillatorType = 'sine'): void {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function playMp3(path: string, fallback: () => void): void {
  const audio = new Audio(path);
  audio.volume = 0.85;
  void audio.play().catch(() => fallback());
}

function playCustomMp3(url: string, fallback: () => void): void {
  const audio = new Audio(url);
  audio.volume = 0.85;
  void audio.play().catch(() => fallback());
}

export function playNotificationSound(
  key: NotificationSoundKey,
  customUrl?: string | null,
): void {
  if (key === 'custom' && customUrl?.trim()) {
    playCustomMp3(customUrl.trim(), () => playOscillator(920, 0.2));
    return;
  }

  switch (key) {
    case 'sound2':
      playMp3('/sounds/order-2.mp3', () => {
        playOscillator(760, 0.12);
        window.setTimeout(() => playOscillator(920, 0.12), 140);
      });
      break;
    case 'sound3':
      playMp3('/sounds/order-3.mp3', () => {
        playOscillator(620, 0.1, 'triangle');
        window.setTimeout(() => playOscillator(780, 0.1, 'triangle'), 120);
        window.setTimeout(() => playOscillator(940, 0.14, 'triangle'), 240);
      });
      break;
    case 'sound1':
    default:
      playMp3('/sounds/order-1.mp3', () => playOscillator(920, 0.2));
      break;
  }
}
