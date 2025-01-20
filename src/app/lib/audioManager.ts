export interface AudioManager {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  startPlayback: (audio: Blob) => Promise<void>;
  stopPlayback: () => void;
  isRecording: boolean;
  isPlaying: boolean;
}

class WebAudioManager implements AudioManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private audioSource: AudioBufferSourceNode | null = null;
  private _isRecording: boolean = false;
  private _isPlaying: boolean = false;

  get isRecording(): boolean {
    return this._isRecording;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this._isRecording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to start recording: ' + (error as Error).message);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioChunks = [];
        this._isRecording = false;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  async startPlayback(audio: Blob): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const arrayBuffer = await audio.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = audioBuffer;
      this.audioSource.connect(this.audioContext.destination);

      this.audioSource.onended = () => {
        this._isPlaying = false;
      };

      this.audioSource.start();
      this._isPlaying = true;
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw new Error('Failed to start playback: ' + (error as Error).message);
    }
  }

  stopPlayback(): void {
    if (this.audioSource && this._isPlaying) {
      this.audioSource.stop();
      this._isPlaying = false;
    }
  }
}

export function createAudioManager(): AudioManager {
  return new WebAudioManager();
} 