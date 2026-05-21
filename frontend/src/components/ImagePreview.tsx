import { DownloadOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Image as AntImage, Skeleton, Tag, Typography } from "antd";
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
        <div style={{ width: 88, height: 88, borderRadius: 28, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(57, 214, 255, 0.14), rgba(139, 125, 255, 0.12))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <PictureOutlined style={{ fontSize: 38, color: 'var(--primary)' }} />
        </div>
        <strong>Upload an image to unlock the live preview</strong>
        <span>The comparison view will appear here after processing.</span>
        <Tag color="cyan" style={{ marginTop: 4 }}>Before / after workspace</Tag>
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
            style={{ width: "100%", borderRadius: 12, objectFit: "contain" }}
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
                style={{ width: "100%", borderRadius: 12, objectFit: "contain" }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <Tag color="cyan">Result ready</Tag>
              <Tag color="geekblue">{processedFilename || 'processed.jpg'}</Tag>
            </div>
            <Button
              icon={<DownloadOutlined />}
              href={processedUrl}
              download={processedFilename || "processed.jpg"}
              className="download-btn"
              size="large"
            >
              Download result
            </Button>
          </motion.div>
        ) : (
          <div className="image-box image-box-pending">
            <Skeleton active title={false} paragraph={{ rows: 4 }} />
            <div style={{ marginTop: 12 }}>Waiting for the pipeline to finish...</div>
          </div>
        )}
      </div>
    </div>
  );
}
