import "gitalk-react/gitalk-dark.css";

import Gitalk from "gitalk-react";
import * as React from "react";

import {
  GITALK_ADMIN,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_REPO,
  GITHUB_REPO_OWNER,
} from "../constants/gitalk";

export interface GitalkProps {
  gitalkId: string;
  className?: string;
}

const GitalkComponent: React.FC<GitalkProps> = ({ gitalkId, ...restProps }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { scrollMargin: "1200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} {...restProps}>
      {visible && (
        <Gitalk
          className="gitalk"
          clientID={GITHUB_APP_CLIENT_ID}
          clientSecret={GITHUB_APP_CLIENT_SECRET}
          owner={GITHUB_REPO_OWNER}
          repo={GITHUB_REPO}
          admin={GITALK_ADMIN}
          id={gitalkId}
          enableHotKey={false}
          createIssueManually
        />
      )}
    </div>
  );
};

export default GitalkComponent;
