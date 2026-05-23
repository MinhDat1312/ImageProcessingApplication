import { DownloadOutlined, PictureOutlined } from "@ant-design/icons";
import { Image as AntImage, Skeleton, Tag, Typography, notification } from "antd";
import { Button } from "./ui/Button";
import { motion } from "framer-motion";
import { ImageComparisonSlider } from "./ImageComparisonSlider";
import axiosInstance from "../api/axiosInstance";

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
  imageId,
}: ImagePreviewProps) {

  const handleDownload = async () => {
    if (!processedUrl) return;
    try {
      notification.info({ message: 'Downloading image...' });

      // Use backend API if imageId is available (avoid CORS)
      if (imageId) {
        const response = await axiosInstance.get(`/api/v1/images/download/${imageId}`, {
          responseType: 'blob',
        });
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = processedFilename || `processed-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        notification.success({ message: 'Download completed' });
      } else {
        // Fallback to direct URL download (may fail due to CORS)
        const res = await fetch(processedUrl);
        if (!res.ok) throw new Error('Fetch failed');
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = processedFilename || `processed-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        notification.success({ message: 'Download completed' });
      }
    } catch {
      // Last fallback: open in new tab
      window.open(processedUrl, '_blank');
      notification.info({ message: 'Opening image in new tab...' });
    }
  };

  if (!originalUrl) {
    return (
      <div className="empty-preview-state">
        <div style={{ width: 88, height: 88, borderRadius: "var(--radius-xl)", display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(57, 214, 255, 0.14), rgba(139, 125, 255, 0.12))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <PictureOutlined style={{ fontSize: 38, color: 'var(--primary)' }} />
        </div>
        <strong>Upload an image to unlock the live preview</strong>
        <span>The comparison view will appear here after processing.</span>
        <Tag color="cyan" style={{ marginTop: "var(--spacing-1)" }}>Before / after workspace</Tag>
      </div>
    );
  }

  return (
    <div className="image-preview-container" style={{ width: "100%" }}>
      {processedUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          style={{ width: "100%" }}
        >
          <ImageComparisonSlider
            originalUrl={originalUrl}
            processedUrl={processedUrl}
            height="400px"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: "var(--spacing-4)", gap: "var(--spacing-3)", flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: "var(--spacing-2)", flexWrap: 'wrap' }}>
              <Tag color="cyan" style={{ margin: 0 }}>Result ready</Tag>
              <Tag color="geekblue" style={{ margin: 0 }}>{processedFilename || 'processed.png'}</Tag>
              {executionTime !== null && (
                <Tag color="success" style={{ margin: 0 }}>
                  {executionTime}ms
                </Tag>
              )}
            </div>
            <Button
              variant="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              size="large"
            >
              Download result
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="image-preview-grid">
          <div className="image-panel">
            <Text strong className="image-panel-title">
              Original image
            </Text>
            <div className="image-box image-box-original">
              <AntImage
                src={originalUrl}
                style={{ width: "100%", borderRadius: "var(--radius-md)", objectFit: "contain" }}
              />
            </div>
          </div>

          <div className="image-panel">
            <Text strong className="image-panel-title">
              Processed image
            </Text>
            <div className="image-box image-box-pending">
              <Skeleton active title={false} paragraph={{ rows: 4 }} />
              <div style={{ marginTop: "var(--spacing-3)" }}>Waiting for the pipeline to finish...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
