import React, { useEffect } from "react";
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
          <li className="nav-item" key={name}>
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
  path?: string;
  children?: JSX.Element | JSX.Element[] | null;
  // Should we `wrap` the children in a page with header/footer. If not we just add the
  // background.
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
        <div className="pageContent">{children}</div>
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
