import React from "react";
import { DieLogo } from "./Die";
import getSoundPlayer from "./audio";

/*
 * volume: 0 (mute), 1, 2, 3 (max)
 */
const SoundIcon = (props: { volume: number }) => {
  const { volume } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 75 75">
      <path
        d="M39.389,13.769 L22.235,28.606 L6,28.606 L6,47.699 L21.989,47.699 L39.389,62.75 L39.389,13.769z"
        className="soundIconPathMain"
      />
      {volume >= 1 && (
        <path d="M48,27.6a19.5,19.5 0 0 1 0,21.4" className="soundIconPath" />
      )}
      {volume >= 2 && (
        <path d="M55.1,20.5a30,30 0 0 1 0,35.6" className="soundIconPath" />
      )}
      {volume >= 3 && (
        <path d="M61.6,14a38.8,38.8 0 0 1 0,48.6" className="soundIconPath" />
      )}
    </svg>
  );
};

type InGameIconsProps = {
  howToPlayOnClick?: () => void;
  volume?: number;
  changeVolume?: () => void;
  showVolume?: boolean;
  historyOnClick?: () => void;
};

const InGameIcons = (props: InGameIconsProps) => {
  let {
    howToPlayOnClick,
    volume,
    changeVolume,
    showVolume,
    historyOnClick,
  } = props;
  if (showVolume == null) {
    showVolume = false;
  }

  const soundPlayer = getSoundPlayer();

  return (
    <div className="homeLinkWrap">
      <div className="inGameIcon homeLinkIcon">
        <a href="/" title="Home">
          <DieLogo />
        </a>
      </div>
      {howToPlayOnClick && (
        <div className="inGameIcon">
          <div
            className="howToPlayWrap"
            title="How To Play"
            onClick={() => howToPlayOnClick && howToPlayOnClick()}
          >
            ?
          </div>
        </div>
      )}
      {historyOnClick && (
        <div className="inGameIcon">
          <div
            className="howToPlayWrap"
            title="Move History"
            onClick={() => historyOnClick && historyOnClick()}
          >
            h
          </div>
        </div>
      )}
      {showVolume && (
        <div
          className="inGameIcon"
          onClick={() => {
            soundPlayer.init();
            changeVolume && changeVolume();
          }}
        >
          <div className="soundIconWrap pointer">
            <SoundIcon volume={volume || 0} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InGameIcons;
