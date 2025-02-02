import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  headline: React.ReactNode;
  subhead?: React.ReactNode;
  body: React.ReactNode;
  actions?: { label: string; url: string }[];
}

const Card: React.FC<CardProps> = (props) => {
  const { headline, subhead, body, actions, className, ...restProps } = props;

  return (
    <div
      className={`rounded-lg border border-foreground-tertiary bg-background-light px-6 py-4 text-foreground shadow-sm shadow-primary-dark transition hover:shadow hover:shadow-primary ${className}`}
      {...restProps}
    >
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
  );
};

export default Card;
