import { SendOutlined } from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Slider,
} from "antd";
import type { FormInstance } from "antd";
import type { ProcessFormValues } from "../types";

interface PipelineControlsProps {
  form: FormInstance<ProcessFormValues>;
  onFinish: (values: ProcessFormValues) => void;
  processing: boolean;
}

export function PipelineControls({
  form,
  onFinish,
  processing,
}: PipelineControlsProps) {
  const filterType = Form.useWatch("filterType", form);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        filterType: "none",
        watermarkPosition: "bottom-right",
        watermarkSize: 30,
        compressionQuality: 1.0,
      }}
    >
      <Divider titlePlacement="left" style={{ margin: "0 0 12px" }}>
        1. Resize
      </Divider>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Form.Item name="resizeWidth" label="Width (px)">
          <InputNumber
            placeholder="Keep original"
            style={{ width: "100%" }}
            min={1}
          />
        </Form.Item>
        <Form.Item name="resizeHeight" label="Height (px)">
          <InputNumber
            placeholder="Keep original"
            style={{ width: "100%" }}
            min={1}
          />
        </Form.Item>
      </div>

      <Divider titlePlacement="left" style={{ margin: "0 0 12px" }}>
        2. Filter
      </Divider>
      <Form.Item name="filterType" label="Filter type">
        <Select
          options={[
            { value: "none", label: "None" },
            { value: "grayscale", label: "Grayscale" },
            { value: "sepia", label: "Sepia" },
            { value: "brightness", label: "Brightness" },
          ]}
        />
      </Form.Item>

      <AnimatePresence>
        {filterType === "brightness" && (
          <motion.div
            key="brightness-slider"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <Form.Item
              name="brightnessLevel"
              label="Brightness level"
              initialValue={1.0}
            >
              <Slider
                min={0.1}
                max={3.0}
                step={0.1}
                tooltip={{ formatter: (value) => `${value}x` }}
                marks={{ 0.1: "0.1", 1: "1.0", 3: "3.0" }}
              />
            </Form.Item>
          </motion.div>
        )}
      </AnimatePresence>

      <Divider titlePlacement="left" style={{ margin: "0 0 12px" }}>
        3. Watermark
      </Divider>
      <Form.Item name="watermarkText" label="Watermark text">
        <Input placeholder="Leave empty to disable watermark" />
      </Form.Item>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Form.Item name="watermarkPosition" label="Position">
          <Select
            options={[
              { value: "bottom-right", label: "Bottom right" },
              { value: "bottom-left", label: "Bottom left" },
              { value: "top-right", label: "Top right" },
              { value: "top-left", label: "Top left" },
              { value: "center", label: "Center" },
            ]}
          />
        </Form.Item>
        <Form.Item name="watermarkSize" label="Font size (px)">
          <InputNumber min={8} max={200} style={{ width: "100%" }} />
        </Form.Item>
      </div>

      <Divider titlePlacement="left" style={{ margin: "0 0 12px" }}>
        4. Compression
      </Divider>
      <Form.Item name="compressionQuality" label="JPEG quality">
        <Slider
          min={0.1}
          max={1.0}
          step={0.1}
          tooltip={{
            formatter: (value) => `${Math.round((value ?? 0) * 100)}%`,
          }}
          marks={{ 0.1: "10%", 0.5: "50%", 1.0: "100%" }}
        />
      </Form.Item>

      <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={processing}
          disabled={processing}
          icon={<SendOutlined />}
          size="large"
          style={{ width: "100%" }}
        >
          {processing ? "Processing..." : "Process image"}
        </Button>
      </Form.Item>
    </Form>
  );
}
