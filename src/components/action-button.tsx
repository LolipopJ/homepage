import { type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import * as React from "react";

import Icon from "./icon";

export interface ActionButtonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon: IconDefinition;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const { icon, onClick, className = "", ...restProps } = props;

  return (
    <div
      className={`flex size-8 cursor-pointer items-center justify-center rounded-full bg-background transition hover:bg-foreground hover:text-background ${className}`}
      onClick={onClick}
      {...restProps}
    >
      <Icon icon={icon} />
    </div>
  );
};

export default ActionButton;
