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
const diceDots = (value: number, currentPlayer: string) =>
  dots[value - 1].map((dot, i) => (
    <circle {...dot} className={`dot dotColor${currentPlayer}`} key={i} />
  ));

interface DieProps {
  currentPlayer: string;
  value: number;
}

export class Die extends React.Component<DieProps> {
  render() {
    return (
      <svg
        className={`die bgcolor${this.props.currentPlayer}`}
        viewBox="0 0 100 100"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#000000">
          {diceDots(this.props.value, this.props.currentPlayer)}
        </g>
      </svg>
    );
  }
}
