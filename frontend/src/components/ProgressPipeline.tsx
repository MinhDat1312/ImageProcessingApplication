import { Spin } from "antd";
import { Steps } from "antd";
import { motion } from "framer-motion";
import type { StepItem } from "../types";

interface ProgressPipelineProps {
  steps: StepItem[];
}

function isWaitingStatus(status: string): boolean {
  return status === "waiting";
}

export function ProgressPipeline({ steps }: ProgressPipelineProps) {
  const hasWaitingSteps = steps.some((step) => isWaitingStatus(step.status));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      style={{ padding: "12px 0" }}
    >
      {hasWaitingSteps && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            padding: "12px 16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 8,
            color: "white",
          }}
        >
          <Spin size="small" indicator={<span style={{ color: "white" }}>⏳</span>} />
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Waiting for processing...
          </motion.span>
        </motion.div>
      )}
      <Steps
        direction="vertical"
        size="small"
        items={steps.map((step) => ({
          title: step.title,
          description: isWaitingStatus(step.status) ? "Waiting..." : step.description,
          status: isWaitingStatus(step.status) ? "process" as const : step.status,
        }))}
      />
    </motion.div>
  );
}
