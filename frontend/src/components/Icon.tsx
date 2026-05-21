// Icon.tsx
// Feather + MaterialCommunityIcons + Ionicons 통합
// Usage: <Icon name="home" size={16} color="#fff" />

import React from "react";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

type FeatherName = React.ComponentProps<typeof Feather>["name"];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

// ─── Feather map ─────────────────────────────────────────────────────────────
const FEATHER_MAP: Record<string, FeatherName> = {
  home: "home",
  doc: "file-text",
  chat: "message-circle",
  settings: "settings",
  bell: "bell",
  camera: "camera",
  image: "image",
  file: "file",
  edit: "edit-2",
  scan: "maximize-2",
  search: "search",
  send: "send",
  check: "check",
  "check-circle": "check-circle",
  x: "x",
  plus: "plus",
  minus: "minus",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  "chevron-down": "chevron-down",
  "arrow-left": "arrow-left",
  "arrow-right": "arrow-right",
  logout: "log-out",
  trash: "trash-2",
  shield: "shield",
  info: "info",
  alert: "alert-triangle",
  "alert-circle": "alert-circle",
  calendar: "calendar",
  clock: "clock",
  user: "user",
  link: "link",
  mail: "mail",
  lock: "lock",
  device: "smartphone",
  globe: "globe",
  list: "list",
  moon: "moon",
  sun: "sun",
  wand: "zap",
  menu: "menu",
  ban: "slash",
  keyboard: "type",
  pdf: "file-text",
  pill: "activity", // closest available in Feather
  running: "activity",
  robot: "cpu",
  fire: "zap",
};

// Fallback to MaterialCommunityIcons for icons missing in Feather
const MCI_MAP: Record<string, MCIName> = {
  pill: "pill",
  robot: "robot",
  fire: "fire",
  running: "run",
  wand: "magic-staff",
};

export default function Icon({ name, size = 18, color = "#0F172A" }: IconProps) {
  // Check MCI first for icons that map better there
  if (MCI_MAP[name]) {
    return <MaterialCommunityIcons name={MCI_MAP[name]} size={size} color={color} />;
    return <MaterialCommunityIcons name={MCI_MAP[name]} size={size} color={color} />;
  }
  const featherName = FEATHER_MAP[name];
  if (featherName) {
    return <Feather name={featherName} size={size} color={color} />;
  }
  return <Feather name="circle" size={size} color={color} />;
}
