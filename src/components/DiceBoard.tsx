import React from "react";

import { Die } from "./Die";

interface DiceBoardProps {
  diceValues: number[];
  color?: number | number[];
  diceHighlight?: boolean[];
  onClick?: (number) => void;
  flat?: boolean;
}

/* The 4 dice in a 2x2 square */
export const DiceBoard = (props: DiceBoardProps) => {
  const { diceValues, color, onClick, diceHighlight, flat } = props;

  const getDie = (index: number): JSX.Element => {
    const opts = {};
    if (onClick) {
      opts["onClick"] = () => onClick(index);
    }

    return (
      <Die
        value={diceValues[index]}
        color={Array.isArray(color) ? color[index] : color}
        key={index}
        highlight={diceHighlight?.[index]}
        {...opts}
      />
    );
  };

  let className = "diceContainer";
  if (flat) {
    className += " flatDiceContainer";
  }

  return (
    <div {...{ className }}>
      <div className="diceRow">
        {getDie(0)}
        {getDie(1)}
      </div>
      <div className="diceRow">
        {getDie(2)}
        {getDie(3)}
      </div>
    </div>
  );
};
