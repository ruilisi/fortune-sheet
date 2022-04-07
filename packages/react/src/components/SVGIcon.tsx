import React from "react";

type Props = {
  name: string;
  width?: number;
  height?: number;
  stroke?: string;
};

const SVGIcon: React.FC<Props> = ({
  width = 24,
  height = 24,
  name,
  stroke,
}) => (
  <svg width={width} height={height} style={stroke ? { stroke } : {}}>
    <use xlinkHref={`#${name}`} />
  </svg>
);

export default SVGIcon;
