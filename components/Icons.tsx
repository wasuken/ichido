import React from "react";
import Svg, { Path } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
};

export const CheckIcon = ({ size = 20, color = "currentColor" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M4 10L8 14L16 6"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusIcon = ({ size = 18, color = "#3d3028" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Path
      d="M9 3V15M3 9H15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const ListIcon = ({ size = 18, color = "#3d3028" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Path
      d="M3 5H15M3 9H15M3 13H10"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

export const TrashIcon = ({ size = 15, color = "#c0a888" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
    <Path
      d="M2 4H13M5 4V3C5 2.4 5.4 2 6 2H9C9.6 2 10 2.4 10 3V4M11 4L10.3 12C10.1 12.7 9.5 13 9 13H6C5.4 13 4.9 12.7 4.7 12L4 4"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ArrowIcon = ({ size = 16, color = "#3d3028" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      d="M3 8H13M9 4L13 8L9 12"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
