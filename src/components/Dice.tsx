import React from "react";

interface DiceProps {
  value: number;
}

export class Dice extends React.Component<DiceProps> {
  render() {
    return (
      <div className="bg-primary dice">
        {this.props.value}
      </div>
    );
  }
}
