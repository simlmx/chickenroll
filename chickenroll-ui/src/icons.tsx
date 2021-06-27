import React from "react";
import { DICE_INDICES } from "chickenroll-game";

// From: https://github.com/tailwindlabs/heroicons/blob/master/src/solid/pencil.svg
export const Pencil = (props: { color?: number }) => {
  const { color } = props;
  let pathClassName = "";
  if (color != null) {
    pathClassName = `dotColor${color}`;
  }
  return (
    <div className="pencil">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className={pathClassName}
          d="M13.5858 3.58579C14.3668 2.80474 15.6332 2.80474 16.4142 3.58579C17.1953 4.36683 17.1953 5.63316 16.4142 6.41421L15.6213 7.20711L12.7929 4.37868L13.5858 3.58579Z"
        />
        <path
          d="M11.3787 5.79289L3 14.1716V17H5.82842L14.2071 8.62132L11.3787 5.79289Z"
          className={pathClassName}
        />
      </svg>
    </div>
  );
};

// From: https://iconify.design/icon-sets/mdi/connection.html
// Ended up not being used but keeping to revision in case we revisit.
export const Disconnected = (props: { title?: string }) => {
  const { title } = props;
  return (
    <div className="disconnected" title={title}>
      <svg
        aria-hidden={true}
        focusable={false}
        style={{ transform: "rotate(360deg)" }}
        preserveAspectRatio="xMidYMid meet"
        viewBox="1 1 23 23"
      >
        <path
          d="M21.4 7.5c.8.8.8 2.1 0 2.8l-2.8 2.8l-7.8-7.8l2.8-2.8c.8-.8 2.1-.8 2.8 0l1.8 1.8l3-3l1.4 1.4l-3 3l1.8 1.8m-5.8 5.8l-1.4-1.4l-2.8 2.8l-2.1-2.1l2.8-2.8l-1.4-1.4l-2.8 2.8l-1.5-1.4l-2.8 2.8c-.8.8-.8 2.1 0 2.8l1.8 1.8l-4 4l1.4 1.4l4-4l1.8 1.8c.8.8 2.1.8 2.8 0l2.8-2.8l-1.4-1.4l2.8-2.9z"
          fill="#626262"
        />
      </svg>
    </div>
  );
};

interface DiceSplitProps {
  // Which split (0=horizontal, 1=vertical, 2=diagonal)
  split: number;
  // For each pair, should they be highlighted
  pairHighlight: boolean[];
}

/*
 * Little icons to represent the dice splits
 */
export const DiceSplit = (props: DiceSplitProps) => {
  const { split, pairHighlight } = props;

  const colorClassNames = ["diceSplitWhite", "diceSplitBlack"];

  const classNames = Array(4).fill("diceSplitDie");

  const diceIndices = DICE_INDICES[split];

  diceIndices.forEach((group, groupIndex) => {
    const palePair = !pairHighlight[groupIndex];
    group.forEach((dieIndex) => {
      classNames[dieIndex] += " " + colorClassNames[groupIndex];
      if (palePair) {
        classNames[dieIndex] += " diceSplitPale";
      }
    });
  });

  return (
    <div className="diceSplit">
      <div className="diceSplitRow">
        <div className={classNames[0]}></div>
        <div className={classNames[1]}></div>
      </div>
      <div className="diceSplitRow">
        <div className={classNames[2]}></div>
        <div className={classNames[3]}></div>
      </div>
    </div>
  );
};
