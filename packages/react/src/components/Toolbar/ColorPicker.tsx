import React from "react";

const palette = [
  [
    "#000000",
    "#444444",
    "#666666",
    "#999999",
    "#cccccc",
    "#eeeeee",
    "#f3f3f3",
    "#ffffff",
  ],
  [
    "#f00f00",
    "#f90f90",
    "#ff0ff0",
    "#0f00f0",
    "#0ff0ff",
    "#00f00f",
    "#90f90f",
    "#f0ff0f",
  ],
  [
    "#f4cccc",
    "#fce5cd",
    "#fff2cc",
    "#d9ead3",
    "#d0e0e3",
    "#cfe2f3",
    "#d9d2e9",
    "#ead1dc",
  ],
  [
    "#ea9999",
    "#f9cb9c",
    "#ffe599",
    "#b6d7a8",
    "#a2c4c9",
    "#9fc5e8",
    "#b4a7d6",
    "#d5a6bd",
  ],
  [
    "#e06666",
    "#f6b26b",
    "#ffd966",
    "#93c47d",
    "#76a5af",
    "#6fa8dc",
    "#8e7cc3",
    "#c27ba0",
  ],
  [
    "#c00c00",
    "#e69138",
    "#f1c232",
    "#6aa84f",
    "#45818e",
    "#3d85c6",
    "#674ea7",
    "#a64d79",
  ],
  [
    "#900900",
    "#b45f06",
    "#bf9000",
    "#38761d",
    "#134f5c",
    "#0b5394",
    "#351c75",
    "#741b47",
  ],
  [
    "#600600",
    "#783f04",
    "#7f6000",
    "#274e13",
    "#0c343d",
    "#073763",
    "#20124d",
    "#4c1130",
  ],
];

type Props = {
  onPick: (color: string) => void;
};

const ColorPicker: React.FC<Props> = ({ onPick }) => {
  return (
    <div className="fortune-toolbar-color-picker">
      {palette.map((rows, i) => (
        <div key={i} className="fortune-toolbar-color-picker-row">
          {rows.map((c) => (
            <div
              key={c}
              className="fortune-toolbar-color-picker-item"
              onClick={() => onPick(c)}
              tabIndex={0}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ColorPicker;
