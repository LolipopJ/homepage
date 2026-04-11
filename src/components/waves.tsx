import * as React from "react";

export interface WavesProps extends React.HTMLAttributes<HTMLDivElement> {
  svgClassName?: string;
  animationDuration?: number;
}

const Waves: React.FC<WavesProps> = (props) => {
  const {
    className = "",
    svgClassName = "",
    animationDuration = 4,
    ...restProps
  } = props;

  return (
    <div className={className} {...restProps}>
      <svg
        viewBox="0 0 2880 200"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`block w-[200%] ${svgClassName}`}
      >
        <g>
          <path
            d="M0,80 C360,50 1080,110 1440,80 C1800,50 2520,110 2880,80 L2880,200 L0,200 Z"
            fill="rgba(196,181,253,0.05)"
          />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            from="0 0"
            to="-1440 0"
            dur={animationDuration + 12 + "s"}
            begin={`-${((animationDuration + 12) * 0.65).toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </g>
        <g>
          <path
            d="M0,100 C360,65 1080,135 1440,100 C1800,65 2520,135 2880,100 L2880,200 L0,200 Z"
            fill="rgba(147,197,253,0.08)"
          />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur={animationDuration + 7 + "s"}
            begin={`-${((animationDuration + 7) * 0.35).toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </g>
        <g>
          <path
            d="M0,122 C360,94 1080,150 1440,122 C1800,94 2520,150 2880,122 L2880,200 L0,200 Z"
            fill="rgba(125,211,252,0.12)"
          />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            from="0 0"
            to="-1440 0"
            dur={animationDuration + 3 + "s"}
            begin={`-${((animationDuration + 3) * 0.85).toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </g>
        <g>
          <path
            d="M0,145 C360,120 1080,170 1440,145 C1800,120 2520,170 2880,145 L2880,200 L0,200 Z"
            fill="rgba(94,234,212,0.17)"
          />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            from="-1440 0"
            to="0 0"
            dur={animationDuration + "s"}
            begin={`-${(animationDuration * 0.15).toFixed(1)}s`}
            repeatCount="indefinite"
          />
        </g>
      </svg>
    </div>
  );
};

export default Waves;
