import React, { useEffect, Suspense, lazy } from "react";
import { LobbyClient } from "boardgame.io/client";
import { SERVER, MAX_PLAYERS, LANGUAGES } from "./constants";
import {
  BrowserRouter,
  Switch,
  Route,
  useRouteMatch,
  Redirect,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import Loading from "./components/Loading";
// import { Debug } from 'boardgame.io/debug';
// import logger from 'redux-logger';
// import { applyMiddleware } from "redux";

const Page = lazy(() => import("./components/PageTemplate"));
const Home = lazy(() => import("./components/Home"));
const HowToPlay = lazy(() => import("./components/HowToPlay"));
const About = lazy(() => import("./components/About"));
const Math = lazy(() => import("./components/Math"));
const Match = lazy(() => import("./components/Match"));
const PassAndPlayMatch = lazy(() => import("./components/PassAndPlayMatch"));

const TITLE =
  "Chicken Roll - Online alternative to Can't Stop, the classic push-your-luck board game";

const DESCRIPTION =
  "Play with your friends, either online or on the same device. Chicken Roll is an online dice game that is free and open source.";

/*
 * Component that does some `action` on the first render.
 * action: some callback to call at the beginning
 */
const DoAction = (props: {
  action: () => void;
  children: JSX.Element | JSX.Element[] | string | null;
}): JSX.Element => {
  useEffect(() => {
    props.action();
  });
  return <>{props.children}</>;
};

let lobbyClient;
const getLobbyClient = () => {
  if (lobbyClient == null) {
    lobbyClient = new LobbyClient({ server: SERVER });
  }
  return lobbyClient;
};

// RENDU ici cleaner tout ca un peu pour pouvoir ajouter /en /fr / devant
interface MainSwitchProps {
  createMatch: () => Promise<string | undefined>;
}

const MainSwitch = (props: MainSwitchProps) => {
  const { createMatch } = props;
  const lobbyClient = getLobbyClient();
  const match = useRouteMatch();

  console.log(match);
  console.log(match.path);
  console.log(window.location.pathname)

  return (
    <Switch>
      {/* Pass and play match */}
      <Route
        exact
        path={`${match.path}/:numPlayers([2345])`}
        render={(props) => {
          const numPlayers = parseInt(props.match.params.numPlayers);
          return (
            <Page
              wrap={false}
              title={`Local Match ${numPlayers} Players | ${TITLE}`}
              description={DESCRIPTION}
            >
              <PassAndPlayMatch {...{ numPlayers }} />
            </Page>
          );
        }}
      />

      {/* Create a match */}
      <Route
        path={`${match.path}/match`}
        exact
        render={() => {
          return (
            <Page
              wrap={false}
              title={"Creating Match | " + TITLE}
              description={DESCRIPTION}
            >
              <DoAction
                action={async () => {
                  const matchID = await createMatch();
                  if (matchID != null) {
                    window.location.replace(`${SERVER}/match/${matchID}`);
                  }
                }}
              >
                {/* We need this <div> because our <Page> is not super happy with strings */}
                <div>Creating Match...</div>
              </DoAction>
            </Page>
          );
        }}
      />

      {/* Regular match with match ID */}
      <Route
        exact
        path={`${match.path}/match/:matchID`}
        render={(props) => {
          const { matchID } = props.match.params;
          return (
            <Page
              wrap={false}
              title={"Match | " + TITLE}
              description={DESCRIPTION}
            >
              <Match {...{ matchID, lobbyClient }} />
            </Page>
          );
        }}
      />

      {/* How to play */}
      <Route
        exact
        path={`${match.path}/howtoplay`}
        render={(props) => {
          return (
            <Page
              path="/howtoplay"
              title={"How To Play | " + TITLE}
              description={"The rules of Chicken Roll."}
            >
              <HowToPlay />
            </Page>
          );
        }}
      />

      {/* About */}
      <Route
        exact
        path={`${match.path}/about`}
        render={(props) => {
          return (
            <Page
              path="/about"
              title={"About | " + TITLE}
              description={
                "Learn more about our open source implementation of Chicken Roll. Get in touch with us."
              }
            >
              <About />
            </Page>
          );
        }}
      />

      {/* Math */}
      <Route
        exact
        path={`${match.path}/math`}
        render={(props) => {
          return (
            <Page
              path="/math"
              title={"Math | " + TITLE}
              description={
                "Interactive probability table for the dice combinations in the board game Can't Stop. Get the probability of busting for any combination of available or blocked columns."
              }
            >
              <Math />
            </Page>
          );
        }}
      />

      {/* Redirect to the home page for anything else.
              This has to be *after* all the other routes.*/}
      {/* TODO use <Link> in react router */}
      <Route
        exact
        path={`${match.path}/:other`}
        render={(props) => {
          window.location.replace(`${SERVER}`);
        }}
      />
      {/* Home */}
      <Route
        path={match.path}
  // let match = useRouteMatch();
        // RENDU dans ce coin ci ca marche pas cette shit de routeur nesté la
        render={(props) => {
          return (
            <Page path="/" title={TITLE} description={DESCRIPTION}>
              <Home />
            </Page>
          );
        }}
      ></Route>
      <Route>
      mais non
      </Route>
    </Switch>
  );
};

const createMatch = async (): Promise<string | undefined> => {
  const lobbyClient = getLobbyClient();

  let matchID;
  try {
    const resp = await lobbyClient.createMatch("cantstop", {
      // This is the maximum number of players. We will adjust the turns if less players
      // join.
      numPlayers: MAX_PLAYERS,
      setupData: {
        passAndPlay: false,
      },
    });
    matchID = resp.matchID;
  } catch (e) {
    alert("There was a problem creating the match. Please try again.");
    return;
  }

  return matchID;
};

const App = () => {
  let paths = LANGUAGES.map((x) => "/" + x);
  paths.push("/");

  console.log(paths);
  return (
    <>
      {/* Default helmet */}
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Helmet>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route path={paths}>
              'patate'
              <MainSwitch createMatch={() => createMatch()} />
            </Route>
          </Switch>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

export default App;
