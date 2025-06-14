import * as React from "react";

export interface PlanetsProps extends React.HTMLAttributes<HTMLDivElement> {
  size: number;
  type?: PlanetsType;
}

export enum PlanetsType {
  DAWN = 2,
  MORNING = 1,
  NOON = 0,
  AFTERNOON = 8,
  DUSK = 3,
  EVENING = 5,
  NIGHT = 7,
  MIDNIGHT = 4,
}

const ORIGINAL_SIZE = 2838;
const SOURCE_SIZE = 561;
const SOURCE_LOCATIONS: [number, number][] = [
  [444, 444],
  [1138, 444],
  [1832, 444],
  [444, 1138],
  [1138, 1138],
  [1832, 1138],
  [444, 1832],
  [1138, 1832],
  [1832, 1832],
];

const getCurrentPlanet = () => {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 5) {
    // 00:00 - 04:59
    return PlanetsType.MIDNIGHT;
  } else if (hour < 8) {
    // 05:00 - 07:59
    return PlanetsType.DAWN;
  } else if (hour < 11) {
    // 08:00 - 10:59
    return PlanetsType.MORNING;
  } else if (hour < 14) {
    // 11:00 - 13:59
    return PlanetsType.NOON;
  } else if (hour < 16) {
    // 14:00 - 15:59
    return PlanetsType.AFTERNOON;
  } else if (hour < 19) {
    // 16:00 - 18:59
    return PlanetsType.DUSK;
  } else if (hour < 21) {
    // 19:00 - 20:59
    return PlanetsType.EVENING;
  } else {
    // 21:00 - 23:59
    return PlanetsType.NIGHT;
  }
};

const Planets: React.FC<PlanetsProps> = ({
  size,
  type = getCurrentPlanet(),
  className = "",
  style,
  ...restProps
}) => {
  const scaledSize = size * (ORIGINAL_SIZE / SOURCE_SIZE);
  const svgScale = scaledSize / ORIGINAL_SIZE;

  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        ...style,
        height: size,
        width: size,
        backgroundImage: 'url("/svgs/planets.svg")',
        backgroundPosition: `calc(-${SOURCE_LOCATIONS[type][0]}px * ${svgScale}) calc(-${SOURCE_LOCATIONS[type][1]}px * ${svgScale})`,
        backgroundSize: scaledSize,
      }}
      {...restProps}
    ></div>
  );
};

export default Planets;
