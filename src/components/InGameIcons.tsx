import React from "react";
import { DieLogo } from "./Die";

type InGameIconsProps = {
  howToPlayOnClick?: () => void;
  showCoffee?: boolean;
};

const InGameIcons = (props: InGameIconsProps) => {
  let { showCoffee, howToPlayOnClick } = props;
  if (showCoffee == null) {
    showCoffee = true;
  }
  return (
    <div className="homeLinkWrap">
      <div className="homeLinkIcon">
        <a href="/" title="Home">
          <DieLogo />
        </a>
      </div>
      {showCoffee && (
        <div className="homeLinkIcon">
          <a
            href="https://www.buymeacoffee.com/simlmx"
            title="Buy Me A Coffee"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="coffee"
              src={`${process.env.PUBLIC_URL}/bmc.svg`}
              alt="buy me a coffee"
            />
          </a>
        </div>
      )}
      {howToPlayOnClick && (
        <div className="homeLinkIcon">
          <div
            className="howToPlayWrap"
            title="How To Play"
            onClick={() => howToPlayOnClick && howToPlayOnClick()}
          >
            ?
          </div>
        </div>
      )}
    </div>
  );
};

export default InGameIcons;
