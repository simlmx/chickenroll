import React, { useState, useEffect } from "react";
import { OddsCalculator } from "../math/probs";

interface NumberProps {
  value: number;
  onMouseDown: () => void;
  selected: boolean;
  // false = blocked mode
  isAllowedMode: boolean;
}

const Number = (props: NumberProps) => {
  const { value, selected, isAllowedMode, onMouseDown } = props;

  let className = "colFgBottom colFgNotBlocked mathNumber user-select-none";

  if (selected) {
    // className += " mathNumberSelected";
    className += isAllowedMode ? " mathNumberAllowed" : " mathNumberForbidden";
  }

  if (value > 9) {
    className += " mathNumber2Digits";
  }
  return <div {...{ className, onMouseDown }}>{value}</div>;
};

const Math = () => {
  const [isAllowedMode, setIsAllowedMode] = useState(true);
  const [selected, setSelected] = useState(Array(11).fill(false));
  const [oddsCalculator, setOddsCalculator] = useState<
    OddsCalculator | undefined
  >(undefined);

  const [prob1, setProb1] = useState(0);

  useEffect(() => {
    setOddsCalculator(new OddsCalculator());
  }, []);

  // Update the probs when something changes.
  useEffect(() => {
    if (oddsCalculator == null) {
      setProb1(0);
      return;
    }

    if (isAllowedMode) {
      const allowed = selected.reduce((acc, value, index) => {
        if (value) {
          acc.push(index + 2);
        }
        return acc;
      }, []);
      const prob2 = oddsCalculator.oddsBust(allowed);
      setProb1(1 - prob2);
    } else {
      const allowed = selected.reduce((acc, value, index) => {
        if (!value) {
          acc.push(index + 2);
        }
        return acc;
      }, []);

      const prob2 = oddsCalculator.oddsBust(allowed);
      setProb1(1 - prob2);
    }
  }, [isAllowedMode, oddsCalculator, selected]);

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
      className={isAllowedMode ? "btn btn-success" : "btn btn-danger"}
      onClick={() => changeMode()}
    >
      {isAllowedMode ? "Allowed" : "Blocked"}
    </button>
  );

  const modeEl = (isAllowedMode: boolean): JSX.Element => {
    return (
      <span
        className={`text-${isAllowedMode ? "success" : "danger"}`}
        style={{ fontWeight: "bold" }}
      >
        {isAllowedMode ? "allowed" : "blocked"}
      </span>
    );
  };

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
        <b>Prob(</b>
        {bust ? "" : "not "}
        <span role="img" aria-label="bust">
          💥
        </span>
        <b>)</b>
      </>
    );
  };

  if (isAllowedMode) {
    probEl = (
      <>
        <p>
          {probBustEl(true)} = <b>Prob(</b>none of {modeEl(isAllowedMode)}
          <b>)</b> = {probAsEl(1 - prob1)}
        </p>
        <p>
          {probBustEl(false)} = <b>Prob(</b>at least one {modeEl(isAllowedMode)}
          <b>)</b> = {probAsEl(prob1)}
        </p>
      </>
    );
  } else {
    probEl = (
      <>
        <p>
          {probBustEl(true)} = <b>Prob(</b>only {modeEl(isAllowedMode)}
          <b>)</b> = {probAsEl(1 - prob1)}
        </p>
        <p>
          {probBustEl(false)} = <b>Prob(</b>at least one <b>not</b>{" "}
          {modeEl(isAllowedMode)}
          <b>)</b> = {probAsEl(prob1)}
        </p>
      </>
    );
  }

  return (
    <div className="math">
      <h1>Math</h1>
      <br />

      <p>
        We have summarized the answers to some frequently asked probability
        questions about <i>Can't Stop!</i> in an interactive way.
      </p>

      <h2>Probability of obtaining given sums</h2>
      <p>
        This will give your the probability of busting if you are only{" "}
        {modeEl(true)} given sums or alternatively if given sums are{" "}
        {modeEl(false)}.
      </p>
      <p>
        <b>Click</b> numbers that are {modeEl(isAllowedMode)}.
      </p>
      <div className="mathWrapWrap">
        <div className="mathWrap row no-gutters">
          <div className="col-sm" />
          <div className="rowsWrap manipulation col-sm">{rows}</div>
          <div className="modeWrap col-sm d-flex flex-sm-column flex-row">
            {modeButton}
            {clearButton}
            {allButton}
          </div>
          <div className="col-sm" />
        </div>
      </div>
      {probEl}
    </div>
  );
};

export default Math;
