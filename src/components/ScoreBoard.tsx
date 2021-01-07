import React from "react";
import { PlayerID, PlayerInfo } from "../types";

const Trophy = (props: { value: number; color: number | "gold" }) => {
  const { color, value } = props;

  let valueClassName = "trophyValue";
  let trophyClassName = "trophyPath";
  // only for the golden effect.
  let gradient;

  if (value === 0) {
    // value == 0 means no trophy. We still put one transparent there as a placeholder.
    valueClassName += " transparent";
    trophyClassName += " transparent";
  } else if (color === "gold") {
    // We treat the special case where we want the trophy to be golden.
    valueClassName += " trophyGoldValue";
    trophyClassName += " trophyGold";
    gradient = (
      <defs>
        <linearGradient id="goldGradient">
          <stop className="lightgold" offset="0%" />
          <stop className="darkgold" offset="20%" />
          <stop className="lightgold" offset="35%" />
          <stop className="lightgold" offset="45%" />
          <stop className="darkgold" offset="80%" />
        </linearGradient>
      </defs>
    );
  } else {
    valueClassName += ` textColor${color}`;
    trophyClassName += ` bgcolor${color}`;
  }

  if (value > 9) {
    valueClassName += " trophyDoubleDigits";
  }

  return (
    <div className="trophyWrap">
      <div className={valueClassName}>{value}</div>
      <svg viewBox="0 0 1502 1340" xmlns="http://www.w3.org/2000/svg">
        {gradient && gradient}
        <path
          d="M 345,760 C 295.66667,652 271,508.33333 271,369 H 107 v 116 c 29.10684,138.34872 135.2969,253.4435 238,275 z M 1395,485 V 369 h -164 c 0,139.33333 -24.6667,283 -74,391 114.6116,-39.51227 232.7235,-150.51191 238,-275 z m 102,-128 v 128 c 0,47.33333 -13.8333,95 -41.5,143 -97.4211,145.23682 -218.5852,259.26034 -366.5,268.00002 -28,36 -59.6667,87.6667 -95,114.99998 -92.26657,79.9493 -155.03567,123.0081 -104.49998,181 20.33328,24.6667 152.83328,37 197.49998,37 69.7949,2.6844 105.2232,19.7167 112,64 v 10 c 0,9.3333 -3,17 -9,23 -6,6 -13.6667,9 -23,9 H 335 c -9.33333,0 -17,-3 -23,-9 -6,-6 -9,-13.6667 -9,-23 v -10 c 7.73718,-49.3677 39.48161,-61.7344 112,-64 44.66667,0 177.16667,-12.3333 197.5,-37 C 686.4722,1134.4783 548.89942,1045.9828 510,1008.9999 474.66667,981.66672 443,930.00002 415,894.00002 241.93722,874.33804 123.89379,758.49765 46.5,628 18.83333,580 5,532.33333 5,485 V 357 c 0,-26.66668 9.33333,-49.33333 28,-68 18.66667,-18.66668 41.33333,-28 67.99999,-28 H 271 V 165 C 271,121 318.66667,83.33333 350,52 381.33333,20.66667 419,5 463,5 h 576 c 44,0 81.6667,15.66667 113,47 31.3333,31.33333 79.9165,69.00955 79,113 v 96 h 170 c 26.6667,0 49.3333,9.33332 68,28 18.6667,18.66667 28,41.33332 28,68 z"
          className={trophyClassName}
        />
      </svg>
    </div>
  );
};

interface ScoreBoardProps {
  scores: { [key: string]: number };
  numVictories: { [key: string]: number };
  playerInfos: { [key: string]: PlayerInfo };
  currentPlayer: PlayerID;
  playOrder: PlayerID[];
  numColsToWin: number | "auto";
}

export class ScoreBoard extends React.Component<ScoreBoardProps> {
  render() {
    const {
      playOrder,
      playerInfos,
      scores,
      currentPlayer,
      numVictories,
      numColsToWin,
    } = this.props;

    if (numColsToWin === "auto") {
      throw new Error("invalid num cols to win");
    }

    const maxNumVictories = Math.max(...Object.values(numVictories));

    const content = playOrder.map((playerID) => {
      const name = playerInfos[playerID].name;
      const color = playerInfos[playerID].color;
      const points = scores[playerID];
      const numVictoriesPlayer = numVictories[playerID];
      // In theory we can finish with 2 more stars than required. For this reason we add
      // 2 transparent stars at the end so that the layout doens't change when it
      // happens.
      const starColumns = Array(numColsToWin + 2)
        .fill(null)
        .map((_, i) => {
          const hasStar = points > i;
          let className;
          if (hasStar) {
            className = `color${color}`;
          } else if (i < numColsToWin) {
            className = "emptyStar";
          } else {
            className = "transparent";
          }
          return (
            <td className="starCol" key={i}>
              <div {...{ className }} key={playerID}>
                ★
              </div>
            </td>
          );
        });
      let className = `scoreBoardPlayerName bgcolor${color}`;
      if (playerID === currentPlayer) {
        className += " scoreBoardPlayerNameCurrent littleFlash";
      }
      return (
        <tr key={playerID}>
          <td className="numVictoriesCol">
            <Trophy
              value={numVictoriesPlayer}
              color={numVictoriesPlayer === maxNumVictories ? "gold" : color}
            />
          </td>
          <td>
            <div {...{ className }}>{name}</div>
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
  }
}
