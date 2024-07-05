import React from "react";

type InGameIconsProps = {
  historyOnClick?: () => void;
};

const InGameIcons = (props: InGameIconsProps) => {
  const { historyOnClick } = props;

  return (
    <div className="homeLinkWrap">
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
