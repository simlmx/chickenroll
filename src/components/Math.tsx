import React, { useState, useEffect } from "react";
import { OddsCalculator } from "../math/probs";
import { Die } from "./Die";
import { rollDice, pickColor, diceValues2sums } from "../math/probs";

const DEFAULT_SELECTED = [
  false,
  false,
  false,
  false,
  true, // 6
  true, // 7
  true, // 8
  false,
  false,
  false,
  false,
];

interface NumberProps {
  value: number;
  onMouseDown: () => void;
  selected: boolean;
  // false = blocked mode
  isAllowedMode: boolean;
}

const Number = (props: NumberProps) => {
  const { value, selected, isAllowedMode, onMouseDown } = props;

  let className =
    "colFgBottom colFgNotBlocked mathNumber user-select-none pointer";

  if (selected) {
    // className += " mathNumberSelected";
    className += isAllowedMode ? " mathNumberAllowed" : " mathNumberForbidden";
  }

  if (value > 9) {
    className += " mathNumber2Digits";
  }
  return <div {...{ className, onMouseDown }}>{value}</div>;
};

const getIndices = (selected: boolean[], expectedValue?: boolean): number[] => {
  if (expectedValue == null) {
    expectedValue = true;
  }

  return selected.reduce((acc: number[], value, index) => {
    if (value === expectedValue) {
      acc.push(index + 2);
    }
    return acc;
  }, []);
};

const MathDie = (props: { value: number; color: number }) => {
  const { value, color } = props;

  return <Die {...{ value, color }} />;
};

const Math = () => {
  const [isAllowedMode, setIsAllowedMode] = useState(true);
  // const [selected, setSelected] = useState(Array(11).fill(false));
  const [selected, setSelected] = useState<boolean[]>(DEFAULT_SELECTED);
  const [oddsCalculator, setOddsCalculator] = useState<
    OddsCalculator | undefined
  >(undefined);

  const [diceColor, setDiceColor] = useState(pickColor());
  const [diceValues, setDiceValues] = useState(rollDice(4));
  const [diceSums, setDiceSums] = useState<number[] | undefined>(undefined); //diceValues2sums(diceValues))

  const [prob, setProb] = useState(0);

  useEffect(() => {
    setOddsCalculator(new OddsCalculator());
  }, []);

  // Update the probs when something changes.
  useEffect(() => {
    if (oddsCalculator == null) {
      setProb(0);
      return;
    }

    if (isAllowedMode) {
      const allowed = selected.reduce((acc: number[], value, index) => {
        if (value) {
          acc.push(index + 2);
        }
        return acc;
      }, []);
      const prob = oddsCalculator.oddsBust(allowed);
      setProb(1 - prob);
    } else {
      const allowed = selected.reduce((acc: number[], value, index) => {
        if (!value) {
          acc.push(index + 2);
        }
        return acc;
      }, []);

      const prob = oddsCalculator.oddsBust(allowed);
      setProb(prob);
    }
  }, [isAllowedMode, oddsCalculator, selected]);

  useEffect(() => {
    setDiceSums(Array.from(diceValues2sums(diceValues)).sort((a, b) => a - b));
  }, [diceValues]);

  const changeMode = () => {
    setIsAllowedMode(!isAllowedMode);
    // If nothing is selected we keep it that way:
    // setSelected(selected.map((x) => !x));
  };

  const toggleN = (n: number): void => {
    const x = selected.slice();
    x[n] = !x[n];
    setSelected(x);
  };

  const makeNumber = (value: number): JSX.Element => {
    return (
      <Number
        value={value}
        onMouseDown={() => toggleN(value - 2)}
        key={value}
        selected={selected[value - 2]}
        isAllowedMode={isAllowedMode}
      />
    );
  };

  const rows = (
    <>
      <div className="mathRow">{[2, 3, 4, 5].map((x) => makeNumber(x))}</div>
      <div className="mathRow mathRowMiddle">
        {[6, 7, 8].map((x) => makeNumber(x))}
      </div>
      <div className="mathRow">{[9, 10, 11, 12].map((x) => makeNumber(x))}</div>
    </>
  );

  const clearButton = (
    <button
      className="btn btn-dark"
      onClick={() => setSelected(Array(11).fill(false))}
    >
      Clear
    </button>
  );

  const allButton = (
    <button
      className="btn btn-dark"
      onClick={() => setSelected(Array(11).fill(true))}
    >
      Select All
    </button>
  );

  const modeButton = (
    <button
      className={
        isAllowedMode ? "btn btn-sm btn-success" : "btn btn-sm btn-danger"
      }
      onClick={() => changeMode()}
    >
      {isAllowedMode ? "Climbing Columns" : "Blocked Columns"}
    </button>
  );

  const probAsEl = (prob: number): JSX.Element => {
    return (
      <b>
        <span title={prob.toString()}>{(100 * prob)?.toFixed(1)}%</span>
      </b>
    );
  };

  let probEl: JSX.Element;

  const probBustEl = (bust: boolean) => {
    return (
      <>
        {bust ? "" : "not "}
        <span role="img" aria-label="bust" title="Probability of busting">
          💥
        </span>
      </>
    );
  };

  const selectedIndices = getIndices(selected);

  const probEltext = isAllowedMode
    ? selectedIndices.length === 1
      ? "Rolling a sum of"
      : "Rolling at least one sum from"
    : "Rolling only sums of";

  probEl = (
    <>
      {selectedIndices.length > 0 && (
        <p>
          <>
            {probEltext}{" "}
            {selectedIndices
              .map<React.ReactNode>((t, i) => (
                <span
                  className={`${
                    isAllowedMode ? "text-success" : "text-danger"
                  }`}
                  key={i}
                >
                  <b>{t}</b>
                </span>
              ))
              .reduce((prev, curr) => [prev, ", ", curr])}
          </>
          {/* In red mode we add the probability to bust inline */}
          {!isAllowedMode && <> = {probBustEl(true)}</>} = {probAsEl(prob)}
        </p>
      )}
      {/* In green mode we add the probability to bust in a differente line */}
      {selectedIndices.length > 0 && isAllowedMode && (
        <p>
          {probBustEl(true)} = {probAsEl(1 - prob)}
        </p>
      )}
    </>
  );

  const diceOnClick = () => {
    setDiceValues(rollDice(4));
    setDiceColor(pickColor());
  };

  const modeExplanationEl = isAllowedMode ? (
    <>
      <p>
        What is the probability of rolling <b>at least one</b> of the{" "}
        <span className="text-success">
          <b>selected</b>
        </span>{" "}
        sums when rolling 4 dice?
      </p>
      <p>
        This is also the probability of <b>not busting</b> when you can only
        climb those columns.
      </p>
    </>
  ) : (
    <>
      <p>
        What is the probability of rolling <b>only</b> the{" "}
        <span className="text-danger">
          <b>selected</b>
        </span>{" "}
        sums when rolling 4 dice?
      </p>
      <p>
        This is also the probability of <b>busting on your first roll</b> when
        those columns are blocked.
      </p>
    </>
  );

  return (
    <div className="mathPage">
      <h1>
        The Math Behind <i>Can't Stop</i>
      </h1>
      <br />

      <h2>Probabilities of rolling different sums</h2>
      <p>
        Here you can interactively find the probabilities of rolling given sums
        when rolling 4 dice.
      </p>
      <div className="diceSums user-select-none">
        <span className="pointer" onMouseDown={diceOnClick}>
          {diceValues.map((value, i) => (
            <MathDie value={value} color={diceColor} key={i} />
          ))}{" "}
        </span>
        &nbsp;→&nbsp;
        <span className="pointer" onMouseDown={diceOnClick}>
          {diceSums
            ?.map<React.ReactNode>((t, i) => <b key={i}>{t}</b>)
            .reduce((prev, curr) => [prev, ", ", curr])}
        </span>
      </div>
      <p>
        <label>
          <b>Mode: </b>
        </label>
        {modeButton}
      </p>
      {modeExplanationEl}
      <div className="mathWrapWrap">
        <div className="mathWrap row no-gutters">
          <div className="col-sm" />
          <div className="rowsWrap manipulation col-sm">{rows}</div>
          <div className="modeWrap col-sm d-flex flex-sm-column flex-row">
            {allButton}
            {clearButton}
          </div>
          <div className="col-sm" />
        </div>
      </div>
      {probEl}
    </div>
  );
};

export default Math;
