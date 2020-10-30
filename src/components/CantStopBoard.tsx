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
  renderInfo() {
    const info = this.props.G.info;
    const { level, message } = info || { message: "", level: "white" };
    const className = `alert alert-${level} text-center info`;
    return (
      <div {...{ className }} role="alert">
        {message}
      </div>
    );
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
        {this.renderInfo()}
        <div className="mainWrap container-fluid px-0">
          {/* Main row with the bulk of the game. */}
          <div className="row mainRow no-gutters align-items-center">
            {/* Column for the mountain */}
            <div className=" col-sm-8 col-xl-7">
              <div className="mountainWrap">
                {/* First column: the mountain. */}
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
              </div>
            </div>
            {/* Second column: dice / actions / score board */}
            <div className="col-sm-4 col-xl-5 rightWrap">
              {/* We put this column in a row so that it can be stacked horizontally as well */}
              {/*<div className="row no-gutters justify-content-center">*/}
              {/* Dice / actions */}
              {/*<div className="col-xl order-sm-2 my-sm-3 diceBoardButtonsWrap">*/}
              <div className="diceBoardButtonWrap">
                <DiceBoard
                  {...{ diceValues, currentPlayer, diceHighlight, diceSplit }}
                />

                <div className="diceButtonsWrap">
                  {this.props.ctx.phase === "gameover" ? (
                    <div className="playAgainContainer">
                      <button
                        onClick={() => this.props.moves.playAgain()}
                        className={`btn bgcolor${this.props.ctx.currentPlayer}`}
                      >
                        Play Again!
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
              {/* Score board */}
              {/*<div className="col-xl order-sm-1 my-sm-3 scoreBoardWrap">*/}
              <ScoreBoard
                {...{ scores, playerNames, currentPlayer, playOrder }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
