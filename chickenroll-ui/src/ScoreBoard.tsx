import React from "react";

import { UserId } from "bgkit";
import { useUsernames } from "bgkit-ui";
import { PlayerInfo } from "chickenroll-game";

import Chicken from "./Chicken";

interface ScoreBoardProps {
  scores: { [key: string]: number };
  playerInfos: { [key: string]: PlayerInfo };
  currentPlayer: UserId;
  playerOrder: UserId[];
  numColsToWin: number | "auto";
}

export const ScoreBoard = ({
  playerOrder,
  playerInfos,
  scores,
  currentPlayer,
  numColsToWin,
}: ScoreBoardProps) => {
  if (numColsToWin === "auto") {
    throw new Error("invalid num cols to win");
  }

  const usernames = useUsernames();

  const content = playerOrder.map((userId) => {
    const name = usernames[userId];
    const color = playerInfos[userId].color;
    const points = scores[userId];

    // In theory we can finish with 2 more stars than required. For this reason we add
    // 2 transparent stars at the end so that the layout doens't change when it
    // happens.
    const starColumns = Array(numColsToWin + 2)
      .fill(null)
      .map((_, i) => {
        const hasStar = points > i;
        let className = "scoreChicken";
        if (hasStar) {
          className += ` scoreChicken${color}`;
        } else if (i < numColsToWin) {
          className += " emptyChicken";
        } else {
          className += " transparentChicken";
        }
        return (
          <td className="starCol" key={i}>
            <div {...{ className }} key={userId}>
              <Chicken />
            </div>
          </td>
        );
      });
    let opts: any = { className: `scoreBoardPlayerName bgcolor${color}` };
    if (userId === currentPlayer) {
      opts.className += " scoreBoardPlayerNameCurrent";
    }
    return (
      <tr key={userId}>
        <td>
          <div className="scoreBoardNameWrap">
            <div {...opts}>{name}</div>
          </div>
        </td>
        {starColumns}
      </tr>
    );
  });

  return (
    <table className="scoreBoard">
      <tbody>{content}</tbody>
    </table>
  );
};
