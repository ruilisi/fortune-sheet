import React from "react";

type Props = {
  name: string;
  width?: number;
  height?: number;
};

const SVGIcon: React.FC<Props> = ({ width = 24, height = 24, name }) => (
  <svg width={width} height={height}>
    <use xlinkHref={`#${name}`} />
  </svg>
);

export default SVGIcon;
