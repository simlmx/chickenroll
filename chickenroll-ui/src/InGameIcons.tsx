import React from "react";

type InGameIconsProps = {
  howToPlayOnClick?: () => void;
  historyOnClick?: () => void;
};

const InGameIcons = (props: InGameIconsProps) => {
  let {
    howToPlayOnClick,
    historyOnClick,
  } = props;

  return (
    <div className="homeLinkWrap">
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
    </div>
  );
};

export default InGameIcons;
