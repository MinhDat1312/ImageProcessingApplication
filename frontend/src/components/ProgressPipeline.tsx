import { Steps } from "antd";
import { motion } from "framer-motion";
import type { StepItem } from "../types";

interface ProgressPipelineProps {
  steps: StepItem[];
}

export function ProgressPipeline({ steps }: ProgressPipelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      style={{ padding: "12px 0" }}
    >
      <Steps
        direction="vertical"
        size="small"
        items={steps.map((step) => ({
          title: step.title,
          description: step.description,
          status: step.status,
        }))}
      />
    </motion.div>
  );
}
