import React from "react";

/*
 * Define the dots as circles in a 100x100 squre
 */

const margin = 27;
const R = 10;

const topLeft = {
  cx: margin,
  cy: margin,
  r: R,
};

const topRight = {
  cx: 100 - margin,
  cy: margin,
  r: R,
};

const bottomLeft = {
  cx: margin,
  cy: 100 - margin,
  r: R,
};

const bottomRight = {
  cx: 100 - margin,
  cy: 100 - margin,
  r: R,
};

const center = {
  cx: 50,
  cy: 50,
  r: R,
};

// The dots for each die.
const dots = [
  [
    {
      cx: 50,
      cy: 50,
      r: 15,
    },
  ],
  [topLeft, bottomRight],
  [topLeft, center, bottomRight],
  [topLeft, topRight, bottomLeft, bottomRight],
  [topLeft, topRight, bottomLeft, bottomRight, center],
  [
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    { cx: margin, cy: 50, r: R },
    { cx: 100 - margin, cy: 50, r: R },
  ],
];

/*
 * Map the value and current player to a list of <circle> tags.
 */
const diceDots = (value: number, currentPlayer: string, highlight?: number) => {
  let className = `dot dotColor${currentPlayer}`;
  if (highlight != null) {
    className += ` dotHighlight${highlight}`;
  }
  return dots[value - 1].map((dot, i) => (
    <circle {...dot} key={i} {...{ className }} />
  ));
};

interface DieProps {
  currentPlayer: string;
  value: number;
  // index to group the highlight dice. If undefined then we don't highlight.
  highlight?: number;
  // In case we want to negative highlight a die.
  noHighlight: boolean;
  split?: string;
}

export class Die extends React.Component<DieProps> {
  render() {
    const { currentPlayer, value, highlight, noHighlight, split } = this.props;

    let className = `die bgcolor${currentPlayer}`;
    if (highlight != null) {
      className += ` dieHightlight${highlight}`;
    } else if (noHighlight) {
      className += " dieNoHighlight";
    }
    if (split != null) {
      className += ` dieSplit${split}`;
    }

    return (
      <svg
        viewBox="0 0 100 100"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        {...{ className }}
      >
        <g fill="#000000">{diceDots(value, currentPlayer, highlight)}</g>
      </svg>
    );
  }
}
