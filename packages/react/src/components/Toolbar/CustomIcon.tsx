import React, { useMemo } from "react";

type Props = {
  iconName?: string;
  width?: number;
  height?: number;
  content?: React.ReactNode;
};

const CustomIcon: React.FC<Props> = ({
  iconName,
  width = 24,
  height = 24,
  content,
}) => {
  const innrContent = useMemo(() => {
    if (iconName) {
      return (
        <svg width={width} height={height}>
          <use xlinkHref={`#${iconName}`} />
        </svg>
      );
    }
    if (content) {
      return content;
    }
    return (
      <svg width={width} height={width}>
        <use xlinkHref="#default" />
      </svg>
    );
  }, [content, height, iconName, width]);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {innrContent}
    </div>
  );
};

export default CustomIcon;
