import { Script } from "gatsby";
import * as React from "react";

import {
  GITALK_ADMIN,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_REPO,
  GITHUB_REPO_OWNER,
} from "../constants/gitalk";

interface GitalkOptions {
  clientID: string;
  clientSecret: string;
  repo: string;
  owner: string;
  admin: string[];
  id: string;
  distractionFreeMode?: boolean;
  createIssueManually?: boolean;
  enableHotKey?: boolean;
}

export interface GitalkProps {
  gitalkId: GitalkOptions["id"];
  className?: string;
}

const GitalkComponent: React.FC<GitalkProps> = ({
  gitalkId,
  className = "",
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const renderGitalk = React.useCallback((id: GitalkOptions["id"]) => {
    const gitalkContainer = ref.current;
    // @ts-expect-error: import Gitalk from CDN
    if (gitalkContainer && window.Gitalk) {
      const gitalkOptions: GitalkOptions = {
        clientID: GITHUB_APP_CLIENT_ID,
        clientSecret: GITHUB_APP_CLIENT_SECRET,
        repo: GITHUB_REPO,
        owner: GITHUB_REPO_OWNER,
        admin: GITALK_ADMIN,
        id,
        distractionFreeMode: false,
        createIssueManually: true,
        enableHotKey: false,
      };
      // @ts-expect-error: import Gitalk from CDN
      const gitalk = new window.Gitalk(gitalkOptions);
      gitalk.render(gitalkContainer);
    }
  }, []);

  React.useEffect(() => {
    renderGitalk(gitalkId);
  }, [gitalkId, renderGitalk]);

  return (
    <>
      <Script
        src="https://unpkg.com/gitalk@1/dist/gitalk.min.js"
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
