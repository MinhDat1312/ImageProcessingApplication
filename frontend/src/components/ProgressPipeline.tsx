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
        style={{ padding: '12px 0' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
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
      style={{ padding: '12px 0' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Tag color="success">{completedCount} complete</Tag>
        <Tag color="processing">{processingCount} active</Tag>
        <Tag color={errorCount ? 'error' : 'default'}>{errorCount ? `${errorCount} failed` : 'No errors'}</Tag>
      </div>
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
            background: "linear-gradient(135deg, rgba(57, 214, 255, 0.18) 0%, rgba(139, 125, 255, 0.2) 100%)",
            borderRadius: 16,
            color: "white",
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 16px 36px rgba(5,8,22,0.32)',
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
      <div style={{
        padding: '16px',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(18, 28, 56, 0.62), rgba(9, 14, 31, 0.54))',
        backdropFilter: 'blur(18px)',
      }}>
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
