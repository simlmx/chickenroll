import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import GameSetup from "./GameSetup";
import MoveButtons from "./MoveButtons";
import { DICE_INDICES } from "../math";
import { GameType } from "../Game";
import { PlayerID } from "../types";

interface CantStopBoardState {
  // diceSplit: 0=horizontal, 1=vertical, 2=diagonal
  // dicePairs : Which of the pairs []: None, [0]: only the first?, [1]: only the second, [0, 1]:
  // both of then.
  // diceSums: The actual sums of the pairs.
  mouseOverPossibility?: { diceSplit: number; dicePairs: number[] };
}

interface CantStopBoardProps {
  G: GameType;
  playerID: PlayerID;
  matchID: string;
  ctx: any;
  moves: any;
  log: any;
  isActive: boolean;
  isConnected: boolean;
  plugins: any;
  _undo: any;
  _redo: any;
  _stateID: any;
  events: any;
  reset: any;
  undo: any;
  redo: any;
  isMultiplayer: boolean;
}

export class CantStopBoard extends React.Component<
  CantStopBoardProps,
  CantStopBoardState
> {
  constructor(props) {
    super(props);
    this.state = {
      mouseOverPossibility: undefined,
    };
  }
  render() {
    const { moves, matchID, ctx, G } = this.props;
    const {
      checkpointPositions,
      currentPositions,
      blockedSums,
      diceSumOptions,
      playerNames,
      diceValues,
      scores,
    } = G;
    const { currentPlayer, phase, numPlayers, playOrder } = ctx;
    const { mouseOverPossibility } = this.state;

    const playerID = G.passAndPlay ? currentPlayer : this.props.playerID;

    if (phase === "setup") {
      return (
        <GameSetup
          {...{
            playerNames,
            playerID,
            moves,
            maxNumPlayers: numPlayers,
            matchID,
          }}
        />
      );
    }

    const info = this.props.G.info;
    const { level, message } = info || { message: "", level: "white" };
    const infoOpts = {
      className: `alert alert-${level} text-center info`,
    };

    // Highlight or not for each die.
    let diceHighlight: boolean[] = Array(4).fill(false);
    let diceSplit: number | undefined = undefined;
    if (this.state.mouseOverPossibility != null) {
      diceSplit = this.state.mouseOverPossibility.diceSplit;
      const { dicePairs } = this.state.mouseOverPossibility;

      const splitIndices: number[][] = DICE_INDICES[diceSplit];

      dicePairs.forEach((pairIndex, i) => {
        splitIndices[pairIndex].forEach((diceIndex) => {
          diceHighlight[diceIndex] = true;
        });
      });
    }

    return (
      <div className="cantStopBoard">
        <div {...infoOpts} role="alert">
          {message}
        </div>
        <div className="upperSection">
          <div className="upperLeft">
            <ScoreBoard
              {...{ scores, playerNames, currentPlayer, playOrder }}
            />
          </div>
          <div className="upperCenter">
            <DiceBoard
              {...{ diceValues, currentPlayer, diceHighlight, diceSplit }}
            />
          </div>
          <div className="upperRight">
            <MoveButtons
              {...{ moves, ctx, G, playerID }}
              onMouseOver={(diceSplit, dicePairs) =>
                this.setState({
                  mouseOverPossibility: { diceSplit, dicePairs },
                })
              }
              onMouseOut={() => {
                this.setState({ mouseOverPossibility: undefined });
              }}
            />
          </div>
        </div>
        <div className="mountainContainer">
          <Mountain
            {...{
              checkpointPositions,
              currentPositions,
              blockedSums,
              currentPlayer,
              diceSumOptions,
              mouseOverPossibility,
            }}
          />
          <div className="playAgainContainer">
            {this.props.ctx.phase === "gameover" && (
              <button
                onClick={() => this.props.moves.playAgain()}
                className={`btn bgcolor${this.props.ctx.currentPlayer}`}
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
