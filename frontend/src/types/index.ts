export type ThemeMode = "light" | "dark";

export const AUTH_LOGOUT_EVENT = 'auth:logout' as const

export interface ProcessFormValues {
  resizeWidth?: number;
  resizeHeight?: number;
  filterType: "none" | "grayscale" | "sepia" | "brightness" | "contrast" | "blur" | "sharpen";
  brightnessLevel?: number;
  contrastLevel?: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  rotateAngle?: number;
  watermarkText?: string;
  watermarkPosition:
    | "top-left"
    | "top-right"
    | "center"
    | "bottom-left"
    | "bottom-right";
  watermarkSize: number;
  compressionQuality: number;
  visibility?: 'public' | 'private' | 'unlisted';
}

export type StepStatus = "wait" | "process" | "finish" | "error" | "waiting";

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
  imageId: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}

export interface LoginResponse {
  userId: string
  username: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  avatar: string
  bio?: string
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
  visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
}

export interface Role {
  roleId: string
  name: string
}

export interface Permission {
  permissionId: string
  name: string
  apiPath: string
  method: string
  module: string
}

export interface AdminRole {
  roleId: string
  name: string
  description?: string
  active: boolean
}

export interface UserAccount {
  userId: string
  username: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  avatar: string
  enabled: boolean
  role: Role
  createdAt: string
  updatedAt: string
}

export interface AdminImage {
  id: string
  filename: string
  url: string
  owner: UserAccount
  createdAt: string
  size?: number
}

export interface AccessLog {
  timestamp: string
  count: number
  hour?: number
  month?: number
  year?: number
}

export interface AccessStats {
  hourly: AccessLog[]
  daily: AccessLog[]
  monthly: AccessLog[]
}
