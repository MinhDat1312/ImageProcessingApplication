import { DownloadOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Image as AntImage, Tag, Typography } from "antd";
import { motion } from "framer-motion";

const { Text } = Typography;

interface ImagePreviewProps {
  originalUrl: string | null;
  processedUrl: string | null;
  executionTime: number | null;
  processedFilename?: string;
}

export function ImagePreview({
  originalUrl,
  processedUrl,
  executionTime,
  processedFilename,
}: ImagePreviewProps) {
  if (!originalUrl) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          opacity: 0.35,
          gap: 12,
        }}
      >
        <PictureOutlined style={{ fontSize: 64 }} />
        <span>Upload an image to preview results</span>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Original image
        </Text>
        <div
          style={{
            border: "1px dashed",
            borderColor: "rgba(0,0,0,0.15)",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <AntImage
            src={originalUrl}
            style={{ width: "100%", borderRadius: 6, objectFit: "contain" }}
          />
        </div>
      </div>

      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Processed image
          {executionTime !== null && (
            <Tag color="success" style={{ marginLeft: 6 }}>
              {executionTime}ms
            </Tag>
          )}
        </Text>

        {processedUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <div
              style={{
                border: "1px solid",
                borderColor: "#91d5ff",
                borderRadius: 8,
                padding: 8,
                backgroundColor: "rgba(24, 144, 255, 0.04)",
              }}
            >
              <AntImage
                src={processedUrl}
                style={{ width: "100%", borderRadius: 6, objectFit: "contain" }}
              />
            </div>
            <Button
              icon={<DownloadOutlined />}
              href={processedUrl}
              download={processedFilename || "processed.jpg"}
              style={{ marginTop: 8, width: "100%" }}
            >
              Download image
            </Button>
          </motion.div>
        ) : (
          <div
            style={{
              border: "1px dashed",
              borderColor: "rgba(0,0,0,0.15)",
              borderRadius: 8,
              padding: "60px 0",
              textAlign: "center",
              opacity: 0.45,
            }}
          >
            Waiting for processing...
          </div>
        )}
      </div>
    </div>
  );
}
