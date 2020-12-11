/*
 * We need this because on iOS we can only play an `Audio` element if it has been played
 * by the user pressing a button. So we always use the same `Audio`.
 */
class SoundPlayer {
  _sound: HTMLAudioElement;
  _hasBeenInitialized: boolean;

  constructor() {
    this._sound = new Audio();
    this._hasBeenInitialized = false;
  }

  async init(): Promise<void> {
    if (this._hasBeenInitialized) {
      return;
    }
    this._hasBeenInitialized = true;
    await this.play("silence");
  }

  setVolume(volume: number): void {
    console.log(volume);
    this._sound.volume = volume;
  }

  play(soundName: string): void {
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
