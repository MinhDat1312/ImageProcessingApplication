import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Switch } from "antd";
import type { ThemeMode } from "../types";

interface ThemeToggleProps {
  themeMode: ThemeMode;
  onToggle: () => void;
}

export function ThemeToggle({ themeMode, onToggle }: ThemeToggleProps) {
  return (
    <Switch
      checked={themeMode === "dark"}
      onChange={onToggle}
      checkedChildren={<MoonOutlined />}
      unCheckedChildren={<SunOutlined />}
    />
  );
}
