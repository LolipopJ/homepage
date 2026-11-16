import * as React from "react";

const FancyBoxImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (
  props,
) => {
  const {
    alt = "The author is too lazy to give an alt",
    src,
    ...restProps
  } = props;
  return (
    <a href={src} data-fancybox="gallery" data-caption={alt}>
      <img src={src} alt={alt} {...restProps} />
    </a>
  );
};

export default FancyBoxImage;
