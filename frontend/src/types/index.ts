export type ThemeMode = "light" | "dark";

export interface ProcessFormValues {
  resizeWidth?: number;
  resizeHeight?: number;
  filterType: "none" | "grayscale" | "sepia" | "brightness";
  brightnessLevel?: number;
  watermarkText?: string;
  watermarkPosition:
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right";
  watermarkSize: number;
  compressionQuality: number;
}

export type StepStatus = "wait" | "process" | "finish" | "error";

export interface StepDef {
  key: string;
  title: string;
  description: string;
}

export interface StepItem extends StepDef {
  status: StepStatus;
}

export interface ProcessResponse {
  url: string;
  filename: string;
  executionTimeMs: number;
}
