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
  return (
    <Gitalk
      {...restProps}
      clientID={GITHUB_APP_CLIENT_ID}
      clientSecret={GITHUB_APP_CLIENT_SECRET}
      owner={GITHUB_REPO_OWNER}
      repo={GITHUB_REPO}
      admin={GITALK_ADMIN}
      id={gitalkId}
      enableHotKey={false}
      createIssueManually
    />
  );
};

export default GitalkComponent;
