import { Script } from "gatsby";
import * as React from "react";

import {
  GITALK_ADMIN,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_REPO,
  GITHUB_REPO_OWNER,
} from "../constants/gitalk";

export interface GitalkProps {
  gitalkId: Gitalk.default.GitalkOptions["id"];
  className?: string;
}

const GitalkComponent: React.FC<GitalkProps> = ({
  gitalkId,
  className = "",
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const renderGitalk = React.useCallback(
    (id: Gitalk.default.GitalkOptions["id"]) => {
      const gitalkContainer = ref.current;

      if (gitalkContainer) {
        gitalkContainer.replaceChildren();

        if (id && window.Gitalk) {
          const gitalk = new window.Gitalk({
            clientID: GITHUB_APP_CLIENT_ID,
            clientSecret: GITHUB_APP_CLIENT_SECRET,
            repo: GITHUB_REPO,
            owner: GITHUB_REPO_OWNER,
            admin: GITALK_ADMIN,
            id,
            distractionFreeMode: false,
            enableHotKey: false,
          });
          gitalk.render(gitalkContainer);
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    renderGitalk(gitalkId);
  }, [gitalkId, renderGitalk]);

  return (
    <>
      <Script
        src="https://unpkg.com/gitalk@1.8.0/dist/gitalk.min.js"
        strategy="idle"
        onLoad={() => renderGitalk(gitalkId)}
      />
      <div
        ref={ref}
        id={`gitalk-${gitalkId}`}
        className={`gitalk ${className}`}
      />
    </>
  );
};

export default GitalkComponent;
