import React, { useState, useEffect } from "react";
import { OddsCalculator } from "../math/probs";

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
}

const Number = (props: NumberProps) => {
  const { value, selected, onMouseDown } = props;

  let className =
    "colFgBottom colFgNotBlocked mathNumber user-select-none pointer";

  className += selected ? " mathNumberAllowed" : " mathNumberForbidden";

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

const probAsEl = (prob: number): JSX.Element => {
  return (
    <b>
      <span title={prob.toString()}>{(100 * prob)?.toFixed(1)}%</span>
    </b>
  );
};

const probLine = (
  text: JSX.Element,
  values: number[],
  colorClassName: string,
  emoji: JSX.Element,
  prob: number
) => {
  return (
    <p>
      {text} <b>{"{"}</b>
      {values.length === 0
        ? []
        : values
            .map<React.ReactNode>((v, i) => (
              <span className={colorClassName} key={i}>
                <b>{v}</b>
              </span>
            ))
            .reduce((prev, curr) => [prev, ", ", curr])}
      <b>{"}"}</b> = {emoji} = {probAsEl(prob)}
    </p>
  );
};

const Math = () => {
  const [selected, setSelected] = useState<boolean[]>(DEFAULT_SELECTED);
  const [oddsCalculator, setOddsCalculator] = useState<
    OddsCalculator | undefined
  >(undefined);

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

    const allowed = selected.reduce((acc: number[], value, index) => {
      if (value) {
        acc.push(index + 2);
      }
      return acc;
    }, []);
    const prob = oddsCalculator.oddsBust(allowed);
    setProb(1 - prob);
  }, [oddsCalculator, selected]);

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
      className="btn btn-danger btn-sm"
      onClick={() => setSelected(Array(11).fill(false))}
    >
      Block All
    </button>
  );

  const allButton = (
    <button
      className="btn btn-success btn-sm"
      onClick={() => setSelected(Array(11).fill(true))}
    >
      Select All
    </button>
  );

  const bustEmoji = (
    <span role="img" aria-label="bust" title="Probability of busting">
      💥
    </span>
  );

  const okEmoji = (
    <span role="img" aria-label="bust" title="Probability of busting">
      👍
    </span>
  );

  const selectedIndices = getIndices(selected);
  const unselectdIndices = getIndices(selected, false);

  const probLine1 = probLine(
    <>
      Rolling <b>at least one</b> sum from{" "}
    </>,
    selectedIndices,
    "text-success",
    okEmoji,
    prob
  );
  const probLine2 = probLine(
    <>
      Rolling <b>only</b> sums from{" "}
    </>,
    unselectdIndices,
    "text-danger",
    bustEmoji,
    1 - prob
  );

  return (
    <div className="mathPage">
      <h1>
        The Math Behind <i>Can't Stop</i>
      </h1>
      <br />
      <h2>Probability of busting</h2>
      <p>Here you can interactively answer questions like:</p>
      <p>
        <i>
          {" "}
          &nbsp;&nbsp;What are the odds of busting when climbing certain{" "}
          <span className="text-success">
            <b>columns</b>
          </span>
          ?
        </i>
      </p>
      <p>
        <i>
          &nbsp;&nbsp;What are the odds of busting on a first roll when some{" "}
          <span className="text-danger">
            <b>columns</b>
          </span>{" "}
          are blocked?
        </i>
      </p>
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
      {probLine1}
      {probLine2}
    </div>
  );
};

export default Math;
