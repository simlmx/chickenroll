import React from "react";

const About = () => {
  return (
    <div className="about">
      <h1>About</h1>
      <br />
      <p>
        <b>Chicken Roll</b> is an online alternative to the classic
        push-your-luck dice game{" "}
        <a href="https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)">
          Can't Stop
        </a>
        , with some added features. We hope that you and your friends enjoy it!
      </p>
      <h2>Code</h2>
      <p>
        This project is open source. You can see the code on{" "}
        <a href="https://github.com/simlmx/chickenroll">github</a>.
      </p>
      <h2>Support Us</h2>
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
        <a href="mailto:info@chickenroll.fun"> info@chickenroll.fun</a> with any{" "}
        <strong>comment</strong>, <strong>suggestion</strong>,{" "}
        <strong>feature request</strong>, <strong>bug</strong>,{" "}
        <strong>question</strong> or just to <strong>say hello</strong> 👋
      </p>
      <p>
        You can also chat with us and other players on our{" "}
        <a href="https://discord.gg/WtPjuAfETb">discord server</a>.
      </p>
    </div>
  );
};

export default About;
