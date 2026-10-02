import * as React from "react";

import {
  GITALK_ADMIN,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_REPO,
  GITHUB_REPO_OWNER,
} from "../constants/gitalk";

const Gitalk = React.lazy(() => import("gitalk-react"));

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

    const observerOptions: IntersectionObserverInit & { scrollMargin: string } =
      {
        scrollMargin: "1200px",
      };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, observerOptions);

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} {...restProps}>
      {visible && (
        <React.Suspense fallback={null}>
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
        </React.Suspense>
      )}
    </div>
  );
};

export default GitalkComponent;
