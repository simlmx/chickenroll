import { UserId } from "bgkit";
import { DICE_INDICES, Move, PlayerInfo } from "chickenroll-game";
import React from "react";

import { BustEmoji } from "./Bust";
import { DiceBoard } from "./DiceBoard";

const ActionBtn = (props: { text: string; color: number }) => (
  <button className={`btn btnAction bgcolor${props.color}`}>
    {props.text}
  </button>
);

interface MoveHistoryProps {
  moveHistory: Move[];
  playerInfos: { [key: string]: PlayerInfo };
}

const MoveHistory = (props: MoveHistoryProps) => {
  const { moveHistory, playerInfos } = props;

  let index = 1;
  let lastUserId: UserId;

  if (moveHistory.length === 0) {
    return <i style={{ color: "lightgrey" }}>No moves yet</i>;
  }

  return (
    <>
      {moveHistory
        // .slice(0, 1)
        .map((move, i) => {
          const { diceValues, diceSplitIndex, diceUsed, userId, bust } = move;

          if (diceValues == null) {
            return null;
          }
          const sortedDiceValues: number[] = [];

          const diceHighlight = [false, false, false, false];

          const choices: number[] = [];

          if (diceSplitIndex != null) {
            DICE_INDICES[diceSplitIndex].forEach((pair) => {
              pair.forEach((index) => sortedDiceValues.push(diceValues[index]));
            });

            diceUsed?.forEach((i) => {
              const die1 = i * 2;
              const die2 = i * 2 + 1;

              choices.push(sortedDiceValues[die1] + sortedDiceValues[die2]);
              diceHighlight[die1] = diceHighlight[die2] = true;
            });
          }

          // Increment the index if we have the same player as before, otherwise set
          // back to 0.
          if (lastUserId == null || userId !== lastUserId) {
            index = 1;
          } else {
            index += 1;
          }
          lastUserId = userId;

          const playerColor = playerInfos[userId].color;

          const indexEl = <div className="moveIndex">{index}</div>;

          const diceEl = (
            <DiceBoard
              diceValues={
                sortedDiceValues.length ? sortedDiceValues : diceValues
              }
              diceHighlight={diceHighlight}
              color={playerColor}
              flat={true}
            />
          );
          const choicesEl = choices.length > 0 && (
            <ActionBtn
              text={choices.map(String).join(" · ")}
              color={playerColor}
            />
          );
          const bustEl = bust && (
            <span className="historyBustEmoji">
              <BustEmoji />
            </span>
          );

          return (
            <div className="moveRow" key={i}>
              {indexEl}
              {diceEl}
              {choicesEl}
              {bustEl}
            </div>
          );
        })
        .reverse()}
    </>
  );
};

export default MoveHistory;
