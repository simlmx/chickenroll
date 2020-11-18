import React from "react";

const About = () => {
  return (
    <div className="about">
      <h1>About</h1>
      <h2>&nbsp;</h2>
      <p>
        We hope that you and your friends enjoy our version of{" "}
        <a href="https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)">
          Can't Stop
        </a>
        !
      </p>
      <p>
        If you like what we do, consider supporting us by{" "}
        <a href="https://www.buymeacoffee.com/simlmx">
          buying the developer a coffee
        </a>
        !
      </p>
      <h2>We want to hear from you! </h2>
      <p>
        Don't hesitate to contact us at{" "}
        <a href="mailto:info@cantstop.fun"> info@cantstop.fun</a> with any{" "}
        <strong>comment</strong>, <strong>suggestion</strong>,{" "}
        <strong>feature request</strong>, <strong>bug</strong>,{" "}
        <strong>question</strong> or just to <strong>say hello</strong>!
      </p>
    </div>
  );
};

export default About;
