import { CloudUploadOutlined, FileImageOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { motion } from "framer-motion";
import { useState } from "react";

interface UploadZoneProps {
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
}

export function UploadZone({ file, previewUrl, onChange }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (info: UploadChangeParam<UploadFile>) => {
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
        className={`upload-dragger ${dragActive ? "is-drag-active" : ""}`}
        beforeUpload={() => false}
        onChange={handleChange}
        onDrop={() => setDragActive(false)}
        maxCount={1}
        accept="image/png,image/jpeg"
        showUploadList={false}
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
              <FileImageOutlined /> {file?.name} - Click or drag to replace
              image
            </span>
          </div>
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">
              Drop image anywhere in this area or click to upload
            </p>
            <p className="ant-upload-hint">
              Large drop target for PNG and JPEG files
            </p>
          </>
        )}
      </Upload.Dragger>
    </motion.div>
  );
}
