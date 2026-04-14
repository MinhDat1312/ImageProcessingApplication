import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ProcessFormValues,
  StepDef,
  StepItem,
  StepStatus,
} from "../types";

export function buildSteps(values: ProcessFormValues): StepDef[] {
  const steps: StepDef[] = [
    {
      key: "upload",
      title: "Uploading image",
      description: "Preparing input data...",
    },
  ];

  if (values.resizeWidth || values.resizeHeight) {
    steps.push({
      key: "resize",
      title: "Resizing",
      description: `${values.resizeWidth ?? "auto"} x ${values.resizeHeight ?? "auto"} px`,
    });
  }

  if (values.filterType !== "none") {
    steps.push({
      key: "filter",
      title: "Applying filter",
      description: `Filter: ${values.filterType}`,
    });
  }

  if (values.watermarkText) {
    steps.push({
      key: "watermark",
      title: "Adding watermark",
      description: values.watermarkText,
    });
  }

  steps.push({
    key: "compress",
    title: "Compressing output",
    description: `Quality: ${Math.round((values.compressionQuality || 1) * 100)}%`,
  });

  return steps;
}

function applyStatus(defs: StepDef[], activeIdx: number): StepItem[] {
  return defs.map((def, idx) => ({
    ...def,
    status: (idx < activeIdx
      ? "finish"
      : idx === activeIdx
        ? "process"
        : "wait") as StepStatus,
  }));
}

export function usePipelineSteps() {
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const defsRef = useRef<StepDef[]>([]);

  const clearTimer = useCallback(() => {
    if (!intervalRef.current) {
      return;
    }
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startSimulation = useCallback(
    (values: ProcessFormValues) => {
      clearTimer();
      const defs = buildSteps(values);
      defsRef.current = defs;
      setSteps(applyStatus(defs, 0));
      setIsRunning(true);

      let idx = 0;
      intervalRef.current = setInterval(() => {
        idx += 1;
        if (idx >= defsRef.current.length) {
          clearTimer();
          setIsRunning(false);
          return;
        }
        setSteps(applyStatus(defsRef.current, idx));
      }, 900);
    },
    [clearTimer],
  );

  const completeAll = useCallback(() => {
    clearTimer();
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "finish" as StepStatus })),
    );
    setIsRunning(false);
  }, [clearTimer]);

  const failCurrent = useCallback(() => {
    clearTimer();
    setSteps((prev) =>
      prev.map((step) =>
        step.status === "process"
          ? { ...step, status: "error" as StepStatus }
          : step,
      ),
    );
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    defsRef.current = [];
    setSteps([]);
    setIsRunning(false);
  }, [clearTimer]);

  return { steps, isRunning, startSimulation, completeAll, failCurrent, reset };
}
