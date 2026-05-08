export type ThemeMode = "light" | "dark";

export const AUTH_LOGOUT_EVENT = 'auth:logout' as const

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

export interface LoginResponse {
  userId: string
  username: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  avatar: string
  enabled: boolean
  role: { roleId: string; name: string }
}

export interface UserResponse extends LoginResponse {
  createdAt: string
  updatedAt: string
}

export interface ImageItem {
  id: string
  url: string
  createdAt: string
}
