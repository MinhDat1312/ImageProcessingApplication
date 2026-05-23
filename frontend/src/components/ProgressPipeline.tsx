import { Skeleton, Spin, Steps, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import type { StepItem, StepStatus } from "../types";

const { Text } = Typography;

interface ProgressPipelineProps {
  steps: StepItem[];
}

function isWaitingStatus(status: StepStatus): boolean {
  return status === "waiting";
}

function toAntStatus(status: StepStatus) {
  if (status === "waiting") return "process" as const
  return status
}

export function ProgressPipeline({ steps }: ProgressPipelineProps) {
  const hasWaitingSteps = steps.some((step) => isWaitingStatus(step.status));
  const completedCount = steps.filter(step => step.status === 'finish').length
  const processingCount = steps.filter(step => step.status === 'process' || step.status === 'waiting').length
  const errorCount = steps.filter(step => step.status === 'error').length

  if (steps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="progress-pipeline-wrap"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
          <Tag color="cyan">Waiting</Tag>
          <Text type="secondary">Run the pipeline to unlock live progress, previews, and result actions.</Text>
        </div>
        <Skeleton active paragraph={{ rows: 4 }} title={false} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="progress-pipeline-wrap"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
        <Tag color="success">{completedCount} complete</Tag>
        <Tag color="processing">{processingCount} active</Tag>
        <Tag color={errorCount ? 'error' : 'default'}>{errorCount ? `${errorCount} failed` : 'No errors'}</Tag>
      </div>
      {hasWaitingSteps && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="progress-waiting-banner"
        >
          <Spin size="small" indicator={<span style={{ color: "white" }}>⏳</span>} />
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="progress-waiting-text"
          >
            Waiting for processing...
          </motion.span>
        </motion.div>
      )}
      <div className="progress-steps-card">
        <Steps
          orientation="vertical"
          size="small"
          items={steps.map((step) => ({
            title: step.title,
            content: isWaitingStatus(step.status) ? 'Waiting...' : step.description,
            status: toAntStatus(step.status),
          }))}
        />
      </div>
    </motion.div>
  );
}
