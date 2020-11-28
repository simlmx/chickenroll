import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import GameSetup from "./GameSetup";
import MoveButtons from "./MoveButtons";
import { DICE_INDICES } from "../math";
import { GameType } from "../Game";
import { PlayerID, PlayerInfo } from "../types";
import { OddsCalculator } from "../math/probs";
import InGameIcons from "./InGameIcons";
import Rules from "./Rules";

export class Info extends React.Component<{
  info?: { code: string; playerID?: PlayerID };
  lastAllowedColumns: number[];
  onClick: () => void;
  playerInfos: { [key: string]: PlayerInfo };

  // playerID of the client instance.
  playerID: PlayerID;
  // When it's your turn, we add it to the Info
  itsYourTurn: boolean;
}> {
  oddsCalculator: OddsCalculator;

  constructor(props) {
    super(props);
    this.oddsCalculator = new OddsCalculator();
  }

  getProbBust(): string {
    const { lastAllowedColumns } = this.props;
    const prob = this.oddsCalculator.oddsBust(lastAllowedColumns);
    const probStr = (Math.round(prob * 1000) / 10).toFixed(1);
    return probStr;
  }

  renderContent(): JSX.Element | undefined {
    const { info, playerInfos, itsYourTurn } = this.props;

    if (info == null) {
      return undefined;
    }

    const { code } = info;

    const itsMe = this.props.playerID === info.playerID;

    const playerName = itsMe
      ? "You"
      : info.playerID && playerInfos[info.playerID].name;

    // We compute it without needing it sometimes. Maybe a `switch` is a bad idea!
    const prob = this.getProbBust();
    const probMsg = (
      <div
        className="probMsgWrap"
        title={`The probability of busting was ${prob}%`}
      >
        <span role="img" aria-label="bust">
          💥
        </span>
        &nbsp;=&nbsp;<strong>{prob}</strong>%
      </div>
    );

    const itsYourTurnTag = itsYourTurn ? (
      <div
        className={`itsYourTurn color${playerInfos[this.props.playerID].color}`}
      >
        It's your turn!
      </div>
    ) : undefined;

    let playerNameTag: JSX.Element | undefined;

    if (["bust", "stop", "win"].includes(code)) {
      playerNameTag = (
        <strong
          className={`infoPlayerName color${
            playerInfos[info.playerID as PlayerID].color
          }`}
        >
          {playerName}
        </strong>
      );
    }

    switch (code) {
      case "bust":
        return (
          <div>
            {itsYourTurnTag}
            <div>
              {playerNameTag} <span className="badge badge-danger">busted</span>
            </div>
            {probMsg}
          </div>
        );
      case "stop":
        return (
          <div>
            {itsYourTurnTag}
            <div>
              {playerNameTag}{" "}
              <span className="badge badge-success">stopped</span>
            </div>
            {probMsg}
          </div>
        );
      case "win":
        return (
          <span>
            {playerNameTag} won!{" "}
            <span role="img" aria-label="party">
              🎉
            </span>
          </span>
        );
      case "start":
        return itsYourTurnTag;
      default:
        return undefined;
    }
  }

  render() {
    const content = this.renderContent();
    if (content == null) {
      return null;
    }

    return (
      <div className="infoWrap" onClick={() => this.props.onClick()}>
        <div className="infoBackground">
          <div className="text-center info">{content}</div>
        </div>
      </div>
    );
  }
}

interface CantStopBoardState {
  // diceSplit: 0=horizontal, 1=vertical, 2=diagonal
  // dicePairs : Which of the pairs []: None, [0]: only the first?, [1]: only the second, [0, 1]:
  // both of then.
  mouseOverPossibility?: { diceSplit: number; dicePairs: number[] };
  // Whenever or not the info pop is visible.
  infoVisible: boolean;
  // Is the rules popup visible.
  showRules: boolean;
  // If true we'll show a "sorry you're too late" kind of message instead of the game.
  gameStartedWithoutYou?: boolean;
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
  infoTimeout?: ReturnType<typeof setTimeout>;
  constructor(props) {
    super(props);
    this.state = {
      mouseOverPossibility: undefined,
      infoVisible: true,
      showRules: false,
      gameStartedWithoutYou: undefined,
    };
  }

  hideInfo(): void {
    this.infoTimeout && clearTimeout(this.infoTimeout);
    this.setState({ infoVisible: false });
  }

  showInfo(): void {
    this.setState({ infoVisible: true });

    // Start a *new* timeout.
    this.infoTimeout && clearTimeout(this.infoTimeout);
    this.infoTimeout = setTimeout(
      () => this.setState({ infoVisible: false }),
      this.props.G.info?.code === "win" || this.itsYourTurn() ? 100000 : 3000
    );
  }

  hideRules(): void {
    this.setState({ showRules: false });
  }

  showRules(): void {
    this.setState({ showRules: true });
  }

  componentDidMount() {
    // This verifies if the game has already started without us.
    // Once the game is started, `G.numPlayers` is set to the number of players that
    // have joined. If our playerID is bigger than that, it means we are not part of
    // those players.
    if (parseInt(this.props.playerID) >= this.props.G.numPlayers) {
      this.setState({ gameStartedWithoutYou: true });
    } else {
      this.setState({ gameStartedWithoutYou: false });
    }
  }

  componentDidUpdate(prevProps) {
    // If the info has changed, we refresh
    const newInfo = this.props.G.info;
    const oldInfo = prevProps.G.info;
    if (newInfo == null) {
      return;
    }
    if (oldInfo == null) {
      this.showInfo();
      return;
    }

    // Here we know that both are not null.
    Object.keys(newInfo).some((key) => {
      const oldValue = oldInfo[key];
      const newValue = newInfo[key];
      if (oldValue !== newValue) {
        this.showInfo();
        return true;
      }
      return false;
    });
  }

  itsYourTurn() {
    return (
      !this.props.G.passAndPlay &&
      this.props.ctx.currentPlayer === this.props.playerID
    );
  }

  render() {
    const { moves, matchID, ctx, G } = this.props;
    const {
      checkpointPositions,
      currentPositions,
      blockedSums,
      diceSumOptions,
      playerInfos,
      diceValues,
      scores,
      numVictories,
      lastAllowedColumns,
      passAndPlay,
    } = G;
    const { currentPlayer, phase, numPlayers, playOrder } = ctx;
    const { mouseOverPossibility, gameStartedWithoutYou } = this.state;

    // If we are in pass-and-play mode, then the playerID is always "0". The
    // "currentPlayer" is what we mean.
    const playerID = passAndPlay ? currentPlayer : this.props.playerID;

    const inGameIcons = (
      <InGameIcons
        showCoffee={!passAndPlay || gameStartedWithoutYou}
        howToPlayOnClick={() => {
          this.setState({ showRules: !this.state.showRules });
        }}
      />
    );

    // If the game has already started we show a sorry message with a crying cat.
    if (gameStartedWithoutYou == null) {
      return "Loading...";
    } else if (gameStartedWithoutYou) {
      return (
        <>
          {inGameIcons}
          <div className="gameStartedWithoutYou container">
            <div>
              <p>
                It seems like this match has already started... without you!
              </p>
              <h1>
                <span role="img" aria-label="crying cat">
                  😿
                </span>
              </h1>
              <a className="btn btn-primary" href="/match">
                Create a new match of your own!
              </a>
            </div>
          </div>
        </>
      );
    }

    if (phase === "setup") {
      return (
        <GameSetup
          {...{
            playerInfos,
            playerID,
            moves,
            maxNumPlayers: numPlayers,
            matchID,
            passAndPlay,
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

    const mountain = (
      <Mountain
        {...{
          checkpointPositions,
          currentPositions,
          blockedSums,
          currentPlayer,
          diceSumOptions,
          mouseOverPossibility,
          playerInfos,
        }}
      />
    );

    const scoreBoard = (
      <ScoreBoard
        {...{
          scores,
          playerInfos,
          currentPlayer,
          playOrder,
          numVictories,
        }}
      />
    );

    const diceBoard = (
      <DiceBoard
        {...{
          diceValues,
          color: playerInfos[currentPlayer].color,
          diceHighlight,
          diceSplit,
        }}
      />
    );

    const buttons =
      this.props.ctx.phase === "gameover" ? (
        <div className="playAgainWrap">
          <button
            onClick={() => {
              this.props.moves.playAgain();
              this.hideInfo();
            }}
            className={`btn btnAction bgcolor${playerInfos[playerID].color}`}
          >
            Play
            <br />
            Again!
          </button>
        </div>
      ) : (
        <MoveButtons
          {...{
            moves,
            ctx,
            G,
            playerID,
            playerColor: playerInfos[playerID].color,
            onRoll: () => this.hideInfo(),
            onStop: () => this.hideInfo(),
          }}
          onMouseEnter={(diceSplit, dicePairs) =>
            this.setState({
              mouseOverPossibility: { diceSplit, dicePairs },
            })
          }
          onMouseLeave={() => {
            this.setState({ mouseOverPossibility: undefined });
          }}
        />
      );

    // We use 3x2 placeholder buttons to make sure the <div> containing them stays the
    // same dimensions. We need them disabled to prevent the mouse changing on mouse
    // over (it happens even if they have dimensions 0x? or ?x0). We also need to make
    // them invisible to prevent some weird click behviour for the buttons next to it.
    const fakeButtons = (
      <div className="fakeButtons">
        <div>
          <button
            className="btn btn-success fakeButton btnAction invisible"
            disabled
          >
            1
          </button>
        </div>
        <div>
          <button
            className="btn btn-success fakeButton btnAction invisible"
            disabled
          >
            1
          </button>
        </div>
        <div>
          <button
            className="btn btn-success fakeButton btnAction invisible"
            disabled
          >
            1
          </button>
        </div>
      </div>
    );

    const fakeButtonsInside = (
      <div className="fakeButtonInsideWrap">
        <button className="btn btnAction fakeButtonInside invisible" disabled>
          11
        </button>
        <button className="btn btnAction fakeButtonInside invisible" disabled>
          12
        </button>
      </div>
    );

    const infoTag = this.state.infoVisible ? (
      <Info
        {...{
          info: G.info,
          lastAllowedColumns,
          onClick: () => this.hideInfo(),
          playerInfos,
          // For pass and play we ignore the playerID.
          // This means we never right "You" but always "player name".
          playerID: passAndPlay ? -1 : playerID,
          itsYourTurn: this.itsYourTurn(),
        }}
      />
    ) : null;

    const rulesModal = (
      <div className="modal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">How To Play</h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={() => this.hideRules()}
              >
                <span aria-hidden="false">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="rules">
                <Rules />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                data-dismiss="modal"
                onClick={() => this.hideRules()}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    // The onClick is necessary to disable the double-click zoom on ios.
    // See stackoverflow.com/a/54753520/1067132
    return (
      <div className="cantStopBoard" onClick={() => {}}>
        {infoTag}
        {this.state.showRules && rulesModal}
        {inGameIcons}
        <div className="megaWrap">
          <div className="bigHspace"></div>
          <div className="boardContent">
            <div className="bandBegin"></div>
            <div className="mountainWrap">
              {/* First column: the mountain. */}
              {mountain}
            </div>
            <div className="bandMiddle"></div>
            {/* Second column: dice / actions / score board */}
            <div className="rightWrap">
              {scoreBoard}
              {/* Section with Dice and Buttons */}
              <div className="diceButtons">
                <div className="diceButtonsBefore"></div>
                {/* Dice */}
                {diceBoard}
                <div className="diceButtonsMiddle"></div>
                {/* Buttons */}
                <div className="fakeButtonsWrap">
                  {/* We insert fake transparent buttons with 0 width xor height as placeholders to make sure the container stays the same size */}
                  {fakeButtons}
                  <div className="buttonsWrap">
                    {fakeButtonsInside}
                    {buttons}
                  </div>
                </div>
                <div className="diceButtonsBefore"></div>
              </div>
            </div>
            <div className="bandEnd"></div>
          </div>
          <div className="bigHspace"></div>
        </div>
      </div>
    );
  }
}
