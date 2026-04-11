import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  headline: React.ReactNode;
  subhead?: React.ReactNode;
  body: React.ReactNode;
  actions?: { label: string; url: string }[];
}

const Card: React.FC<CardProps> = (props) => {
  const {
    headline,
    subhead,
    body,
    actions,
    className = "",
    style,
    onMouseMove,
    onMouseLeave,
    ...restProps
  } = props;

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsHovered(true);
    },
    [onMouseMove],
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      setIsHovered(false);
    },
    [onMouseLeave],
  );

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-xl border border-neutral-700/60 bg-background-light px-6 py-4 text-foreground shadow-md shadow-black/20 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/30 ${className}`}
      style={
        {
          ...style,
          "--glow-x": `${mousePos.x}px`,
          "--glow-y": `${mousePos.y}px`,
          "--glow-opacity": isHovered ? 1 : 0,
        } as React.CSSProperties
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...restProps}
    >
      {/* Glow effect layer */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_circle_at_var(--glow-x)_var(--glow-y),var(--background-lighter),transparent_60%)] opacity-[--glow-opacity] transition-opacity duration-300" />
      {/* Border glow effect layer */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(400px_circle_at_var(--glow-x)_var(--glow-y),var(--background-lighter),transparent_60%)] p-px opacity-[--glow-opacity] transition-opacity duration-300 [-webkit-mask-composite:xor] [mask-composite:exclude] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]" />
      <div className="relative">
        <div className="text-lg font-bold">{headline}</div>
        {subhead && <div className="mt-3">{subhead}</div>}
        <div className="mt-2 text-sm text-neutral-300">{body}</div>
        {actions && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {actions.map(({ label, url }, index) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`!rounded-full !border !border-primary !px-3 !py-1.5 !text-sm !transition hover:!border-solid hover:!no-underline ${index === actions.length - 1 ? "!bg-primary-light !text-background hover:!border-primary hover:!bg-primary" : "!text-primary hover:!border-primary-light hover:!text-primary-light"}`}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
