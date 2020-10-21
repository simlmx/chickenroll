import React from "react";

interface DieProps {
  value: number;
}

export class Die extends React.Component<DieProps> {
  render() {
    return <div className="die">{this.props.value}</div>;
  }
}
