import React, { MouseEvent } from "react";

/*
 * Define the dots as circles in a 100x100 squre
 */

const margin = 20;
const R = 11;

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
      r: R,
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
const diceDots = (value: number, color?: number) => {
  let className = `dot`;
  if (color != null) {
    className += ` dotColor${color}`;
  }
  return dots[value - 1].map((dot, i) => (
    <circle {...dot} key={i} {...{ className }} />
  ));
};

interface DieProps {
  color?: number;
  value: number;
  highlight?: boolean;
  onClick?: () => void;
}

export const Die = (props: DieProps) => {
  const { color, value, highlight, onClick } = props;

  let className = "die";
  if (color != null) {
    className += ` bgcolor${color}`;
  }
  if (highlight) {
    className += " dieHighlight";
  }
  const opts: any = { className };

  if (onClick) {
    // onMousedown doesn't fall laggy compared to onClick
    opts["onMouseDown"] = (e: MouseEvent) => {
      e.preventDefault();
      onClick();
    };
    opts["className"] += " pointer";
  }

  return (
    <svg
      viewBox="0 0 100 100"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      {...opts}
    >
      <g fill="#000000">{diceDots(value, color)}</g>
    </svg>
  );
};
