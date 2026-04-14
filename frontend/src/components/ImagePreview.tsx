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
      <div className="empty-preview-state">
        <PictureOutlined style={{ fontSize: 64 }} />
        <span>Upload an image to preview results</span>
      </div>
    );
  }

  return (
    <div className="image-preview-grid">
      <div className="image-panel">
        <Text strong className="image-panel-title">
          Original image
        </Text>
        <div className="image-box image-box-original">
          <AntImage
            src={originalUrl}
            style={{ width: "100%", borderRadius: 8, objectFit: "contain" }}
          />
        </div>
      </div>

      <div className="image-panel">
        <Text strong className="image-panel-title">
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
            <div className="image-box image-box-processed">
              <AntImage
                src={processedUrl}
                style={{ width: "100%", borderRadius: 8, objectFit: "contain" }}
              />
            </div>
            <Button
              icon={<DownloadOutlined />}
              href={processedUrl}
              download={processedFilename || "processed.jpg"}
              className="download-btn"
            >
              Download image
            </Button>
          </motion.div>
        ) : (
          <div className="image-box image-box-pending">
            Waiting for processing...
          </div>
        )}
      </div>
    </div>
  );
}
