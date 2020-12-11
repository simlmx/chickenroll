class SoundPlayer {
  _sound: HTMLAudioElement;
  _hasBeenInitialized: boolean;

  constructor() {
    console.log("const");
    this._sound = new Audio();
    this._hasBeenInitialized = false;
  }

  async init(): Promise<void> {
    console.log("init");
    if (this._hasBeenInitialized) {
      return;
    }
    this._hasBeenInitialized = true;
    await this.play("silence");
  }

  setVolume(volume: number): void {
    console.log("setvol");
    this._sound.volume = volume;
  }

  play(soundName: string): void {
    console.log("play");
    if (!this._hasBeenInitialized) {
      console.warn("sound player has not been initialized");
    }
    this._sound.src = `/sounds/${soundName}.mp3`;
    this._sound.play();
  }
}

let soundPlayer: SoundPlayer;
const getSoundPlayer = () => {
  if (soundPlayer == null) {
    soundPlayer = new SoundPlayer();
  }
  return soundPlayer;
};

export default getSoundPlayer;
