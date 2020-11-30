import React from "react";
import Rules from "./Rules";

const HowToPlay = (props) => {
  return (
    <div>
      <h1> How to play </h1>
      <div className="rules">
        <Rules />
        <h2>Try it out</h2>
        <p>
          The simplest way to learn the game is to{" "}
          <a href="/match">play with a friend</a> or{" "}
          <a href="/2">against yourself</a>.
        </p>
      </div>
    </div>
  );
};

export default HowToPlay;
