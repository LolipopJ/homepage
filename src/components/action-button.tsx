import { type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import * as React from "react";

import Icon from "./icon";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconDefinition;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const { icon, onClick, className = "", ...restProps } = props;

  return (
    <button
      type="button"
      className={`
        flex size-10 cursor-pointer items-center justify-center rounded-full
        bg-background transition
        hover:bg-foreground hover:text-background
        focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-primary
        ${className}
      `}
      onClick={onClick}
      {...restProps}
    >
      <Icon icon={icon} aria-hidden="true" />
    </button>
  );
};

export default React.memo(ActionButton);
