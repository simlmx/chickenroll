import React from "react";

interface DiceProps {
  value: number;
}

export class Dice extends React.Component<DiceProps> {
  render() {
    return (
      <button type="button" className="btn btn-dark dice">
        {this.props.value}
      </button>
    );
  }
}
