import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import * as React from "react";

import Icon from "./icon";

interface GamePlatformCardProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  platform: string;
  platformColor: { light: string; dark: string };
  logo: IconDefinition | string;
  id: string;
  url: string;
  avatar: string;
  hardware: string;
  hardwareImage: string;
}

const GamePlatformCard: React.FC<GamePlatformCardProps> = ({
  platform,
  platformColor,
  logo,
  id,
  url,
  avatar,
  hardware,
  hardwareImage,
  className = "",
  ...props
}) => {
  return (
    <a
      {...props}
      className={`group relative isolate grid min-w-0 place-items-center overflow-hidden rounded-xl border border-border bg-background-light px-2 py-3.5 text-center transition duration-300 hover:!border-solid hover:!border-primary hover:!pb-3.5 hover:!no-underline focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${className}`}
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      <span className="relative z-10 flex flex-col items-center gap-2">
        <span
          className="flex items-center gap-1.5 font-semibold text-foreground-secondary"
          style={{
            color: `light-dark(${platformColor.light}, ${platformColor.dark})`,
          }}
        >
          {typeof logo === "string" ? (
            <span
              aria-hidden="true"
              className="size-4 shrink-0 bg-current"
              style={{ mask: `url("${logo}") center / contain no-repeat` }}
            />
          ) : (
            <Icon icon={logo} aria-hidden="true" />
          )}
          {platform}
        </span>
        <img
          src={avatar}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="size-12 !rounded-full object-cover ring-1 ring-border"
        />
        <span className="max-w-full break-words text-sm font-bold text-foreground transition-colors motion-reduce:transition-none">
          {id}
        </span>
      </span>
      <img
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[54%] translate-x-3 object-contain opacity-0 transition-[opacity,transform] duration-[240ms] ease-[ease] [mask-image:radial-gradient(ellipse_74%_56%_at_64%_50%,#000_45%,transparent_100%)] group-hover:translate-x-0 group-hover:opacity-80 group-focus-visible:translate-x-0 group-focus-visible:opacity-80 motion-reduce:transition-none"
        src={hardwareImage}
        alt={hardware}
        loading="lazy"
        decoding="async"
      />
    </a>
  );
};

export default GamePlatformCard;
