import React from "react";

import { Die } from "./Die";
import classnames from "classnames";

interface DiceBoardProps {
  diceValues: number[];
  color?: number | number[];
  diceHighlight?: boolean[];
  flat?: boolean;
}

/* The 4 dice in a 2x2 square */
export const DiceBoard = (props: DiceBoardProps) => {
  const { diceValues, color, diceHighlight, flat } = props;

  const getDie = (index: number): JSX.Element => {
    return (
      <Die
        value={diceValues[index]}
        color={Array.isArray(color) ? color[index] : color}
        key={index}
        highlight={diceHighlight?.[index]}
      />
    );
  };
  return (
    <div className={classnames("diceContainer", flat && "flatDiceContainer")}>
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
