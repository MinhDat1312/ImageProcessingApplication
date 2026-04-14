import { Steps } from "antd";
import { motion } from "framer-motion";
import type { StepItem } from "../types";

interface ProgressPipelineProps {
  steps: StepItem[];
  elapsedTimeMs: number;
  executionTimeMs: number | null;
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function ProgressPipeline({
  steps,
  elapsedTimeMs,
  executionTimeMs,
}: ProgressPipelineProps) {
  const hasError = steps.some((step) => step.status === "error");
  const timingLabel = executionTimeMs !== null
    ? "Completed in"
    : hasError
      ? "Stopped after"
      : "Elapsed time";
  const timingValue = executionTimeMs ?? elapsedTimeMs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="progress-pipeline"
    >
      <div className="progress-timer-card">
        <span className="progress-timer-label">{timingLabel}</span>
        <strong className="progress-timer-value">
          {formatDuration(timingValue)}
        </strong>
      </div>

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
