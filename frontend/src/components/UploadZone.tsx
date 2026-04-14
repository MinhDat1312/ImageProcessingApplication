import { CloudUploadOutlined, FileImageOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { motion } from "framer-motion";

interface UploadZoneProps {
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
}

export function UploadZone({ file, previewUrl, onChange }: UploadZoneProps) {
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
    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
      <Upload.Dragger
        beforeUpload={() => false}
        onChange={handleChange}
        maxCount={1}
        accept="image/png,image/jpeg"
        showUploadList={false}
        style={{ padding: "8px" }}
      >
        {previewUrl ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "8px 0",
            }}
          >
            <img
              src={previewUrl}
              alt="preview"
              style={{
                maxHeight: 160,
                maxWidth: "100%",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
            <span style={{ fontSize: 12, opacity: 0.6 }}>
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
              Drag image here or click to select
            </p>
            <p className="ant-upload-hint">Supports PNG and JPEG</p>
          </>
        )}
      </Upload.Dragger>
    </motion.div>
  );
}
