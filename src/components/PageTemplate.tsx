import React from "react";
import { Background } from "./Die";

interface HeaderProps {
  path: string;
}

const Header = (props: HeaderProps) => {
  const navItems = { "/": "Home", "/howtoplay": "How To Play" };
  return (
    <nav className="navbar navbar-expand navbar-primary">
      <ul className="navbar-nav">
        {Object.entries(navItems).map(([path, name]) => (
          <li className="nav-item">
            <a
              className={`nav-link ${props.path === path ? "active" : ""}`}
              href={path}
            >
              {name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const Footer = (props) => {
  return (
    <footer>
      <span className="muted-text small text-center">
        Drop us a line! <br />
        <a
          href="mailto:info@cantstop.fun"
          title="Questions / Feedback / Comments"
        >
          info@cantstop.fun
        </a>
      </span>
    </footer>
  );
};

interface PageProps {
  path: string;
  children?: JSX.Element | JSX.Element[] | null;
}

/*
 * Template for a typical page with background / footer and some content.
 */
const Page = (props: PageProps): JSX.Element => {
  return (
    <div className="backgroundWrap">
      <div className="pageContentWrap">
        <Header path={props.path} />
        {props.children}
        <Footer />
      </div>
      <Background />
    </div>
  );
};

export default Page;
