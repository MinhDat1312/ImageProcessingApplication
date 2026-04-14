import { PictureOutlined } from "@ant-design/icons";
import { Card, ConfigProvider, Form, Layout, notification, theme } from "antd";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { ImagePreview } from "./components/ImagePreview";
import { PipelineControls } from "./components/PipelineControls";
import { ProgressPipeline } from "./components/ProgressPipeline";
import { ThemeToggle } from "./components/ThemeToggle";
import { UploadZone } from "./components/UploadZone";
import { usePipelineSteps } from "./hooks/usePipelineSteps";
import { useTheme } from "./hooks/useTheme";
import type { ProcessFormValues, ProcessResponse } from "./types";

const { Header, Content } = Layout;

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
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
        "http://localhost:8080/api/images/process",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      completeAll();
      setProcessedUrl(response.data.url);
      setProcessedFilename(response.data.filename);
      setExecutionTime(response.data.executionTimeMs);
      notification.success({
        message: "Image processed successfully",
        description: `Pipeline completed in ${response.data.executionTimeMs} ms`,
        duration: 3,
      });
    } catch (err: unknown) {
      failCurrent();
      const error = err as ApiError;
      const message =
        error.response?.data?.error ??
        error.message ??
        "An unexpected error occurred while processing the image";

      notification.error({
        message: "Processing failed",
        description: message,
        duration: 5,
      });
    } finally {
      setProcessing(false);
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
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PictureOutlined style={{ fontSize: 22, color: "#1890ff" }} />
            <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>
              Image Processing Pipeline
            </span>
          </div>
          <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
        </Header>

        <Content style={{ padding: "32px 48px" }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "380px 1fr",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <UploadZone
                file={file}
                previewUrl={previewUrl}
                onChange={handleUploadChange}
              />

              <Card bordered={false} styles={{ body: { padding: 16 } }}>
                <AnimatePresence mode="wait">
                  {showProgress ? (
                    <ProgressPipeline key="progress" steps={steps} />
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
            </div>

            <Card bordered={false} style={{ minHeight: 500 }}>
              <ImagePreview
                originalUrl={previewUrl}
                processedUrl={processedUrl}
                executionTime={executionTime}
                processedFilename={processedFilename}
              />
            </Card>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
