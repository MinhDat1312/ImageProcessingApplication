import { CloudUploadOutlined, FileImageOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { motion } from "framer-motion";
import { useState } from "react";

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
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
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
        accept="image/png,image/jpeg"
        showUploadList={false}
        disabled={disabled}
        style={{ padding: "20px" }}
      >
        {previewUrl ? (
          <div className="upload-preview-content">
            <img
              src={previewUrl}
              alt="preview"
              className="upload-preview-image"
            />
            <span className="upload-preview-name">
              <FileImageOutlined /> {file?.name} - {disabled ? 'Vui lòng đăng nhập để thay đổi' : 'Click or drag to replace image'}
            </span>
            {file && <span className="upload-preview-meta">{formatFileSize(file.size)}</span>}
          </div>
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">
              {disabled 
                ? 'Đăng nhập để mở khóa private workspace' 
                : 'Drop an image, paste a screenshot, or click to upload'}
            </p>
            <p className="ant-upload-hint">
              {disabled 
                ? 'Bạn cần đăng nhập để lưu lịch sử, gallery, và pipeline presets' 
                : 'PNG, JPG, WEBP • Optimized for instant preview and processing'}
            </p>
          </>
        )}
      </Upload.Dragger>
    </motion.div>
  );
}
