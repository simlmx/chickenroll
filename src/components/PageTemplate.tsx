import React, { useEffect } from "react";
import { Background } from "./Die";

interface HeaderProps {
  path: string;
}

const Header = (props: HeaderProps) => {
  const navItems = [
    {
      path: "/",
      name: "Home",
    },
    {
      path: "/howtoplay",
      name: "How To Play",
    },
    {
      path: "/math",
      name: "Math",
    },
    {
      path: "https://www.buymeacoffee.com/simlmx",
      name: "Support Us",
      external: true,
    },
    {
      path: "/about",
      name: "About",
    },
  ];

  return (
    <nav className="navbar navbar-expand navbar-primary">
      <ul className="navbar-nav">
        {navItems.map((navItem) => {
          const opts: any = {
            className: `nav-link ${
              props.path === navItem.path ? "active" : ""
            }`,
            href: navItem.path,
          };

          if (navItem.external) {
            opts.target = "_blank";
            opts.rel = "noopener noreferrer";
          }

          return (
            <li className="nav-item" key={navItem.name}>
              <a {...opts}>{navItem.name}</a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

type FooterProps = {};

const Footer = (props) => {
  return (
    <footer>
      <div className="footerIcon">
        <a
          className="atIcon"
          href="mailto:info@cantstop.fun"
          title="info@cantstop.fun"
        >
          @
        </a>
      </div>
      <div className="footerIcon">
        <a
          href="https://github.com/simlmx/cantstop"
          title="Github"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="icon"
            src={`${process.env.PUBLIC_URL}/gh.png`}
            alt="github"
          />
        </a>
      </div>
      <div className="footerIcon">
        <a
          href="https://www.buymeacoffee.com/simlmx"
          title="Buy me a coffee"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="icon"
            src={`${process.env.PUBLIC_URL}/bmc.svg`}
            alt="Buy me a coffee"
          />
        </a>
      </div>
      <div className="footerIcon">
        <a
          href="https://discord.gg/WtPjuAfETb"
          title="Discord"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="icon discordIcon"
            src={`${process.env.PUBLIC_URL}/discord.svg`}
            alt="Discord"
          />
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
}

/*
 * Template for a typical page with background / footer and some content.
 */
const Page = (props: PageProps): JSX.Element => {
  // Defaults to true
  let { wrap, children, path, title } = props;

  useEffect(() => {
    document.title = title;
  }, [title]);

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
      {content}
      <Background />
    </div>
  );
};

export default Page;
