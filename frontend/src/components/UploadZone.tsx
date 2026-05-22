import { CloudUploadOutlined, FileImageOutlined, FileOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Tag, Upload, Typography } from "antd";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const { Text } = Typography;

function formatFileSize(bytes: number) {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

interface UploadZoneProps {
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

export function UploadZone({ file, previewUrl, onChange, disabled }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (info: UploadChangeParam<UploadFile>) => {
    if (disabled) return;
    
    if (info.fileList.length > 0) {
      const nextFile = info.fileList[0].originFileObj;
      if (nextFile) {
        onChange(nextFile, URL.createObjectURL(nextFile));
        return;
      }
    }

    onChange(null, null);
  };

  return (
    <motion.div
      className="upload-zone-shell"
      whileHover={{ scale: disabled ? 1 : 1.008 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDrop={() => setDragActive(false)}
    >
      <Upload.Dragger
        className={`upload-dragger ${dragActive ? "is-drag-active" : ""} ${disabled ? "is-disabled" : ""}`}
        beforeUpload={() => false}
        onChange={handleChange}
        onDrop={() => setDragActive(false)}
        maxCount={1}
        accept="image/png,image/jpeg,image/webp,image/avif"
        showUploadList={false}
        disabled={disabled}
        style={{ padding: "20px" }}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div
              key="upload-selected"
              className="upload-preview-content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Tag color="cyan"><RadarChartOutlined /> Live preview ready</Tag>
                <Tag color="geekblue">Replace anytime</Tag>
              </div>
              <img
                src={previewUrl}
                alt="preview"
                className="upload-preview-image"
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Text strong style={{ color: 'var(--text-primary)' }}>
                  <FileImageOutlined /> {file?.name ?? 'Selected image'}
                </Text>
                <Text type="secondary" className="upload-preview-name">
                  {disabled ? 'Sign in to change image' : 'Click or drag to replace this image'}
                </Text>
                {file && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Tag icon={<FileOutlined />} color="default">{formatFileSize(file.size)}</Tag>
                    <Tag color="purple">{file.type || 'image/*'}</Tag>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload-empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined style={{ fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">
                {disabled
                  ? 'Sign in to unlock private workspace'
                  : 'Drop an image, paste a screenshot, or click to upload'}
              </p>
              <p className="ant-upload-hint">
                {disabled
                  ? 'Please sign in to save history, gallery, and pipeline presets'
                  : 'PNG, JPG, WEBP, AVIF • instant local preview, then process in one flow'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 }}>
                <Tag color="cyan">Drag & drop</Tag>
                <Tag color="purple">Paste screenshot</Tag>
                <Tag color="geekblue">Browse file</Tag>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Upload.Dragger>
    </motion.div>
  );
}
