import { PictureOutlined } from "@ant-design/icons";
import { Card, ConfigProvider, Form, Layout, notification, theme } from "antd";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { ImagePreview } from "./components/ImagePreview";
import { PipelineControls } from "./components/PipelineControls";
import { ProgressPipeline } from "./components/ProgressPipeline";
import { ThemeToggle } from "./components/ThemeToggle";
import { UploadZone } from "./components/UploadZone";
import { usePipelineSteps } from "./hooks/usePipelineSteps";
import { useTheme } from "./hooks/useTheme";
import type { ProcessFormValues, ProcessResponse } from "./types";

const { Header, Content } = Layout;

interface ApiErrorResponse {
  error?: string;
  message?: string;
  status?: number;
  path?: string;
  timestamp?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8082";
const DEFAULT_ERROR_MESSAGE =
  "An unexpected error occurred while processing the image";

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      DEFAULT_ERROR_MESSAGE
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}

function App() {
  const { themeMode, toggleTheme } = useTheme();
  const { steps, isRunning, startSimulation, completeAll, failCurrent, reset } =
    usePipelineSteps();

  const [form] = Form.useForm<ProcessFormValues>();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedFilename, setProcessedFilename] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const processingStartedAtRef = useRef<number | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!processing || processingStartedAtRef.current === null) {
      return;
    }

    const intervalId = setInterval(() => {
      setElapsedTime(Date.now() - processingStartedAtRef.current!);
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [processing]);

  const handleUploadChange = (
    nextFile: File | null,
    nextPreviewUrl: string | null,
  ) => {
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return nextPreviewUrl;
    });

    setFile(nextFile);
    setProcessedUrl(null);
    setProcessedFilename(undefined);
    setExecutionTime(null);
    setElapsedTime(0);
    processingStartedAtRef.current = null;
    form.resetFields(["resizeWidth", "resizeHeight", "watermarkText"]);
  };

  const onFinish = async (values: ProcessFormValues) => {
    if (!file) {
      notification.warning({
        message: "Please select an image before processing",
      });
      return;
    }

    setProcessing(true);
    setProcessedUrl(null);
    setExecutionTime(null);
    setElapsedTime(0);
    processingStartedAtRef.current = Date.now();
    startSimulation(values);

    const formData = new FormData();
    formData.append("file", file);

    if (values.resizeWidth) {
      formData.append("resizeWidth", String(values.resizeWidth));
    }
    if (values.resizeHeight) {
      formData.append("resizeHeight", String(values.resizeHeight));
    }

    if (values.filterType && values.filterType !== "none") {
      formData.append("filterType", values.filterType);
      if (values.brightnessLevel) {
        formData.append("brightnessLevel", String(values.brightnessLevel));
      }
    }

    if (values.watermarkText) {
      formData.append("watermarkText", values.watermarkText);
      formData.append(
        "watermarkPosition",
        values.watermarkPosition || "bottom-right",
      );
      formData.append("watermarkSize", String(values.watermarkSize));
    }

    formData.append("compressionQuality", String(values.compressionQuality));

    try {
      const response = await axios.post<ProcessResponse>(
        `${API_BASE_URL}/api/images/process`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      completeAll();
      setProcessedUrl(response.data.url);
      setProcessedFilename(response.data.filename);
      setExecutionTime(response.data.executionTimeMs);
      setElapsedTime(response.data.executionTimeMs);
      notification.success({
        message: "Image processed successfully",
        description: `Pipeline completed in ${response.data.executionTimeMs} ms`,
        duration: 3,
      });
    } catch (err: unknown) {
      failCurrent();
      const message = getApiErrorMessage(err);

      notification.error({
        message: "Processing failed",
        description: message,
        duration: 5,
      });
    } finally {
      setProcessing(false);
      processingStartedAtRef.current = null;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => {
        reset();
      }, 2500);
    }
  };

  const showProgress = isRunning || steps.length > 0;

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1d4ed8",
          colorInfo: "#1d4ed8",
          colorSuccess: "#16a34a",
          colorError: "#dc2626",
          borderRadius: 14,
        },
      }}
    >
      <Layout
        className={`app-layout ${themeMode === "dark" ? "theme-dark" : "theme-light"}`}
      >
        <Header className="app-header">
          <div className="app-title-group">
            <PictureOutlined className="app-title-icon" />
            <span className="app-title-text">Image Processing Pipeline</span>
          </div>
          <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
        </Header>

        <Content className="app-content">
          <div className="app-shell">
            <Card
              bordered={false}
              className="upload-hero-card"
              styles={{ body: { padding: 20 } }}
            >
              <UploadZone
                file={file}
                previewUrl={previewUrl}
                onChange={handleUploadChange}
              />
            </Card>

            <div className="workspace-grid">
              <Card
                bordered={false}
                className="settings-card"
                styles={{ body: { padding: 20 } }}
              >
                <div className="settings-header">
                  <h2>Pipeline Settings</h2>
                  <p>Adjust each stage, then run processing.</p>
                </div>

                <AnimatePresence mode="wait">
                  {showProgress ? (
                    <ProgressPipeline
                      key="progress"
                      steps={steps}
                      elapsedTimeMs={elapsedTime}
                      executionTimeMs={executionTime}
                    />
                  ) : (
                    <PipelineControls
                      key="controls"
                      form={form}
                      onFinish={onFinish}
                      processing={processing}
                    />
                  )}
                </AnimatePresence>
              </Card>

              <Card
                bordered={false}
                className="preview-card"
                styles={{ body: { padding: 20 } }}
              >
                <ImagePreview
                  originalUrl={previewUrl}
                  processedUrl={processedUrl}
                  executionTime={executionTime}
                  processedFilename={processedFilename}
                />
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
