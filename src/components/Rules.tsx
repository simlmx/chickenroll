import React from "react";
import { Die } from "./Die";
import { PlayerID } from "../types";
import { Climber, ColNum, ClimberPlaceholder } from "./Mountain";

interface RulesProps {
  playerID?: PlayerID;
}

const Rules = (props) => {
  const playerID = props.playerID == null ? "0" : props.playerID;
  const makeDie = (value: number) => (
    <Die value={value} currentPlayer={playerID} />
  );
  const dice = [1, 2, 3, 6].map((value) => makeDie(value));
  const runner = <Climber playerID={playerID} current={true} />;
  const token = <Climber playerID={playerID} />;

  const actionBtn = (text: string) => (
    <button className={`btn btnAction bgcolor${playerID}`}>{text}</button>
  );

  const placeAtBottom = (
    <table className="table table-sm table-borderless mountain">
      <tbody>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">{runner}</div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={4} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={5} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={6} />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const placeAfter = (
    <table className="table table-sm table-borderless mountain">
      <tbody>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">{runner}</div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">{token}</div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={1} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={4} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={5} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={6} />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  const moveUp = (
    <table className="table table-sm table-borderless mountain">
      <tbody>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">{runner}</div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <Climber playerID={playerID} current={true} downlight={true} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">{token}</div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={1} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ClimberPlaceholder columnParity={0} />
            </div>
          </td>
        </tr>
        <tr>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={4} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={5} />
            </div>
          </td>
          <td className="mountainCol">
            <div className="mountainCell">
              <ColNum colNum={6} />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="rules">
      <p>
        At your turn, you can either {actionBtn("Roll")} or {actionBtn("Stop")}.
        When rolling, you try to make your <strong>runners</strong> ({runner})
        progress. When stopping, you end your turn but keep your progress. You
        can roll as many times as you like until you either{" "}
        <strong>stop</strong> or <strong>bust</strong>.
      </p>
      <h3>Roll</h3>
      <p>
        You roll the four dice {dice} and split them into two pairs ({dice[0]}
        {dice[1]}|{dice[2]}
        {dice[3]} or {dice[0]}
        {dice[2]}|{dice[1]}
        {dice[3]} or {dice[0]}
        {dice[3]}|{dice[1]}
        {dice[2]}) such that you can do one of the following actions for at
        least one of the pairs.
      </p>
      <ul>
        <li>
          Add a new {runner} on the column corresponding to the sum of the pair.
          You can have up to three {runner}.
          <ul>
            <li>
              Place it at the bottom of the column if you don't have a colored
              token in this column.
              <div className="ruleRow">
                {dice[1]}
                {dice[2]} &nbsp;→&nbsp; {placeAtBottom}
              </div>
            </li>
            <li>
              Place it one step above your current colored token if you have
              one.
              <div className="ruleRow">
                {dice[1]}
                {dice[2]} &nbsp;→&nbsp; {placeAfter}
              </div>
            </li>
          </ul>
        </li>
        <li>
          Move an already placed <strong>runner</strong> up in the column
          corresponding to the sum of the pair.
          <div className="ruleRow">
            {dice[1]}
            {dice[2]} &nbsp;→&nbsp; {moveUp}
          </div>
        </li>
      </ul>

      <p>
        If you can do one of the actions for both pairs, then you must do it.
      </p>
      <p>
        If you can't do any action for any dice split, you <strong>bust</strong>
        . You lose the progress made by the <strong>runners</strong> and your
        turn ends.
      </p>

      <h3>Stop</h3>
      <p>
        You change your <strong>runners</strong> into tokens of your color (
        {runner} → {token}) and end your turn. Those will be your new
        checkpoints in their respective columns.
      </p>
      <p>
        If you get to the end of a column, it becomes <strong>blocked</strong>{" "}
        by you. From now on no one can use it.
      </p>
      <p>
        The first player to <strong>block</strong> three columns{" "}
        <strong>wins</strong>.
      </p>
    </div>
  );
};

export default Rules;
