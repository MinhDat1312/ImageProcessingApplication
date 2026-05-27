import { EyeInvisibleOutlined, GlobalOutlined, SendOutlined } from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import { Form, InputNumber, Segmented, Slider, Tag } from "antd";
import type { FormInstance } from "antd";
import type { ProcessFormValues } from "../types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface PipelineControlsProps {
  form: FormInstance<ProcessFormValues>;
  onFinish: (values: ProcessFormValues) => void;
  processing: boolean;
  disabled?: boolean;
}

const filterOptions = [
  { value: "none", label: "None" },
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia", label: "Sepia" },
  { value: "brightness", label: "Brightness" },
  { value: "contrast", label: "Contrast" },
  { value: "blur", label: "Blur" },
  { value: "sharpen", label: "Sharpen" },
];

const rotationOptions = [
  { value: 0, label: "0 deg (None)" },
  { value: 90, label: "90 deg" },
  { value: 180, label: "180 deg" },
  { value: 270, label: "270 deg" },
];

const watermarkPositionOptions = [
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
  { value: "center", label: "Center" },
];

export function PipelineControls({
  form,
  onFinish,
  processing,
  disabled,
}: PipelineControlsProps) {
  const filterType = Form.useWatch("filterType", form);
  const visibilityValue = Form.useWatch("visibility", form) ?? "private";

  return (
    <Form
      className="pipeline-form"
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={disabled}
      initialValues={{
        filterType: "none",
        watermarkPosition: "bottom-right",
        watermarkSize: 30,
        compressionQuality: 1.0,
      }}
    >
      <div className="pipeline-intro">
        <div>
          <span className="section-kicker">Smart Controls</span>
          <h3>Shape the output with guided, animation-rich adjustments</h3>
        </div>
        <div className="pipeline-badges">
          <Tag color="blue">Realtime</Tag>
          <Tag color="purple">Reusable presets</Tag>
          <Tag color="cyan">Accessible</Tag>
        </div>
      </div>

      <div className="control-sections-grid">
        <section className="control-section">
          <h3>1. Resize canvas</h3>
          <div className="control-fields two-col">
            <Form.Item name="resizeWidth" label="Width">
              <InputNumber
                placeholder="Keep original"
                style={{ width: "100%" }}
                min={1}
              />
            </Form.Item>
            <Form.Item name="resizeHeight" label="Height">
              <InputNumber
                placeholder="Keep original"
                style={{ width: "100%" }}
                min={1}
              />
            </Form.Item>
          </div>
        </section>

        <section className="control-section">
          <h3>2. Filter lens</h3>
          <div className="control-fields one-col">
            <Form.Item name="filterType" label="Filter">
              <select className="pipeline-native-select" disabled={disabled} aria-label="Filter">
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Form.Item>
            <AnimatePresence mode="wait">
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
              {filterType === "contrast" && (
                <motion.div
                  key="contrast-slider"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}
                >
                  <Form.Item
                    name="contrastLevel"
                    label="Contrast level"
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
          </div>
        </section>

        <section className="control-section">
          <h3>3. Crop image</h3>
          <div className="control-fields two-col">
            <Form.Item name="cropX" label="Crop X">
              <InputNumber placeholder="X offset" style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="cropY" label="Crop Y">
              <InputNumber placeholder="Y offset" style={{ width: "100%" }} min={0} />
            </Form.Item>
          </div>
          <div className="control-fields two-col">
            <Form.Item name="cropWidth" label="Width">
              <InputNumber placeholder="Width" style={{ width: "100%" }} min={1} />
            </Form.Item>
            <Form.Item name="cropHeight" label="Height">
              <InputNumber placeholder="Height" style={{ width: "100%" }} min={1} />
            </Form.Item>
          </div>
        </section>

        <section className="control-section">
          <h3>4. Rotate</h3>
          <div className="control-fields one-col">
            <Form.Item name="rotateAngle" label="Rotation angle" initialValue={0}>
              <select className="pipeline-native-select" disabled={disabled} aria-label="Rotation angle">
                {rotationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Form.Item>
          </div>
        </section>

        <section className="control-section">
          <h3>5. Watermark layer</h3>
          <div className="control-fields one-col">
            <Form.Item name="watermarkText" label="Watermark text">
              <Input placeholder="Leave empty to disable watermark" />
            </Form.Item>
            <div className="control-fields two-col">
              <Form.Item name="watermarkPosition" label="Position">
                <select className="pipeline-native-select" disabled={disabled} aria-label="Watermark position">
                  {watermarkPositionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Form.Item>
              <Form.Item name="watermarkSize" label="Font size (px)">
                <InputNumber min={8} max={200} style={{ width: "100%" }} />
              </Form.Item>
            </div>
          </div>
        </section>

        <section className="control-section">
          <h3>6. Compression</h3>
          <div className="control-fields one-col">
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
          </div>
        </section>

        <section className="control-section">
          <h3>7. Output Title</h3>
          <div className="control-fields one-col">
            <Form.Item name="title" label="Title">
              <Input placeholder="Give your creation a name (optional)" />
            </Form.Item>
          </div>
        </section>

        <section className="control-section" style={{ gridColumn: '1 / -1' }}>
          <h3>8. Visibility</h3>
          <div className="control-fields one-col">
            <Form.Item name="visibility" initialValue="private" style={{ marginBottom: 8 }}>
              <Segmented
                block
                options={[
                  { label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><GlobalOutlined />Public</span>, value: 'public' },
                  { label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><EyeInvisibleOutlined />Private</span>, value: 'private' },
                ]}
              />
            </Form.Item>
            <p className="visibility-hint">
              {visibilityValue === 'public'
                ? 'Visible in the community feed and searchable by everyone.'
                : 'Only you can see this image. Switch to Public when ready to share.'}
            </p>
          </div>
        </section>
      </div>

      <Form.Item className="submit-row">
        <Button
          variant="primary"
          htmlType="submit"
          loading={processing}
          disabled={processing || disabled}
          icon={<SendOutlined />}
          size="large"
          style={{ width: "100%" }}
        >
          {disabled ? "Sign in to process" : (processing ? "Processing image..." : "Run pipeline")}
        </Button>
      </Form.Item>
    </Form>
  );
}
