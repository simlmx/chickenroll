import React, { Profiler } from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

const onRender = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interations
) => {
  console.log(id);
  console.log(phase);
  console.log(actualDuration);
  console.log(baseDuration);
};

ReactDOM.render(
  <Profiler id={"main"} onRender={() => {}}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Profiler>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
