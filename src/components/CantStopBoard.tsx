import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import GameSetup from "./GameSetup";
import MoveButtons from "./MoveButtons";
import { DICE_INDICES } from "../math";
import { GameType } from "../Game";

interface CantStopBoardState {
  // diceSplit: 0=horizontal, 1=vertical, 2=diagonal
  // dicePairs : Which of the pairs []: None, [0]: only the first?, [1]: only the second, [0, 1]:
  // both of then.
  // diceSums: The actual sums of the pairs.
  mouseOverPossibility?: { diceSplit: number; dicePairs: number[] };
}

interface CantStopBoardProps {
  G: GameType;
  playerID: string;
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
    const playerID = this.props.G.passAndPlay
      ? this.props.ctx.currentPlayer
      : this.props.playerID;
    const phase = this.props.ctx.phase;

    if (phase === "setup") {
      return (
        <GameSetup
          playerNames={this.props.G.playerNames}
          playerID={this.props.playerID}
          moves={this.props.moves}
          maxNumPlayers={this.props.ctx.numPlayers}
          matchID={this.props.matchID}
        />
      );
    }

    const info = this.props.G.info;
    const { level, message } = info || { message: "", level: "white" };
    const infoOpts = {
      className: `alert alert-${level} text-center info`,
    };

    // Dice indedx -> 0/1 where 0 and 1 are the 2 groups.
    let diceHighlightPairs: { [key: number]: number } = {};
    let diceSplit2: number | undefined = undefined;
    if (this.state.mouseOverPossibility != null) {
      const { diceSplit, dicePairs } = this.state.mouseOverPossibility;
      diceSplit2 = diceSplit;

      const splitIndices: number[][] = DICE_INDICES[diceSplit];

      dicePairs.forEach((pairIndex, i) => {
        splitIndices[pairIndex].forEach((diceIndex) => {
          diceHighlightPairs[diceIndex] = i;
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
              scores={this.props.G.scores}
              playerNames={this.props.G.playerNames}
              currentPlayer={this.props.ctx.currentPlayer}
              playOrder={this.props.ctx.playOrder}
            />
          </div>
          <div className="upperCenter">
            <DiceBoard
              diceValues={this.props.G.diceValues}
              currentPlayer={this.props.ctx.currentPlayer}
              diceHighlightPairs={diceHighlightPairs}
              diceSplit={diceSplit2}
            />
          </div>
          <div className="upperRight">
            <MoveButtons
              moves={this.props.moves}
              ctx={this.props.ctx}
              G={this.props.G}
              playerID={playerID}
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
            checkpointPositions={this.props.G.checkpointPositions}
            currentPositions={this.props.G.currentPositions}
            blockedSums={this.props.G.blockedSums}
            currentPlayer={this.props.ctx.currentPlayer}
            diceSumOptions={this.props.G.diceSumOptions}
            mouseOverPossibility={this.state.mouseOverPossibility}
          />
          <div className="playAgainContainer">
            {this.props.ctx.phase === "gameover" && (
              <button
                onClick={() => this.props.moves.playAgain()}
                className="btn btn-primary"
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
