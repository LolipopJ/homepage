import {
  FontAwesomeIcon,
  type FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import * as React from "react";

const Icon: React.FC<FontAwesomeIconProps> = (props) => (
  <FontAwesomeIcon {...props} />
);

export default Icon;
