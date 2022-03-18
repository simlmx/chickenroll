import React from "react";
import { Background } from "./Die";
import { Helmet } from "react-helmet";
import bmc from "../images/bmc.svg";
import discord from "../images/discord.svg";
import gh from "../images/gh.png";
import { URL_PREFIX } from "../constants";

interface HeaderProps {
  path: string;
}

const Header = (props: HeaderProps) => {
  const navItems = [
    {
      path: URL_PREFIX,
      name: "Play",
      component: (
        <button className="btn btn-primary btn-sm playEmphasis">Play</button>
      ),
    },
    {
      path: `${URL_PREFIX}/howtoplay`,
      name: "How To Play",
    },
    {
      path: `${URL_PREFIX}/math`,
      name: "Math",
    },
    {
      path: "https://www.buymeacoffee.com/simlmx",
      name: "Support Us",
      external: true,
    },
    {
      path: `${URL_PREFIX}/about`,
      name: "About",
    },
  ];

  return (
    <nav className="navbar navbar-expand navbar-primary">
      <ul className="navbar-nav">
        {navItems.map((navItem, i) => {
          const active = props.path === navItem.path;
          const opts: any = {
            className: `nav-link ${active ? "active" : ""}`,
            href: navItem.path,
          };

          if (navItem.external) {
            opts.target = "_blank";
            opts.rel = "noopener noreferrer";
          }

          return (
            <li className="nav-item" key={navItem.name}>
              {/* If it's a component we use it only when it's not selected. Currently only for the Play link. */}
              <a {...opts}>
                {navItem.component && !active
                  ? navItem.component
                  : navItem.name}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const Footer = (props) => {
  return (
    <footer>
      <div className="footerIcon">
        <a
          className="atIcon"
          href="mailto:info@chickenroll.fun"
          title="info@chickenroll.fun"
        >
          @
        </a>
      </div>
      <div className="footerIcon">
        <a
          href="https://github.com/simlmx/chickenroll"
          title="Github"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className="icon" src={gh} alt="github" />
        </a>
      </div>
      <div className="footerIcon">
        <a
          href="https://www.buymeacoffee.com/simlmx"
          title="Buy me a coffee"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className="icon" src={bmc} alt="Buy me a coffee" />
        </a>
      </div>
      <div className="footerIcon">
        <a
          href="https://discord.gg/WtPjuAfETb"
          title="Discord"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className="icon discordIcon" src={discord} alt="Discord" />
        </a>
      </div>
    </footer>
  );
};

interface PageProps {
  path?: string;
  children?: JSX.Element | JSX.Element[] | null;
  // Should we `wrap` the children in a page with header/footer. If not we just add the
  // background. Defaults to 'true'.
  wrap?: boolean;
  // title for the html page
  title: string;
  description: string;
}

/*
 * Template for a typical page with background / footer and some content.
 */
const Page = (props: PageProps): JSX.Element => {
  // Defaults to true
  let { wrap, children, path, title, description } = props;

  const headers = (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </Helmet>
  );

  if (wrap == null) {
    wrap = true;
  }

  let content;
  if (wrap) {
    if (path == null) {
      throw new Error("path of Page should be wrap=true");
    }
    content = (
      <div className="pageContentWrap">
        <Header path={path} />
        <div className="pageContent container">{children}</div>
        <Footer />
      </div>
    );
  } else {
    content = children;
  }
  return (
    <div className="backgroundWrap">
      {headers}
      {content}
      <Background />
    </div>
  );
};

export default Page;
