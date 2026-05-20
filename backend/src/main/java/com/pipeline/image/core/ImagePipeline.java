package com.pipeline.image.core;

import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public class ImagePipeline {
    private final List<ImageStage> stages = new ArrayList<>();

    public void addStage(ImageStage stage) {
        stages.add(stage);
    }

    public PipelineContext execute(PipelineContext context) throws Exception {
        long startTime = System.currentTimeMillis();
        log.info("Pipeline: Starting with {} stages", stages.size());

        for (int i = 0; i < stages.size(); i++) {
            ImageStage stage = stages.get(i);
            if (context.isHasError()) {
                log.info("Pipeline: Stopping early due to previous error");
                break;
            }
            log.info("Pipeline: Executing stage {}/{} - {}", i + 1, stages.size(), stage.getClass().getSimpleName());
            context = stage.process(context);
            log.info("Pipeline: Stage {}/{} complete - hasError: {}", i + 1, stages.size(), context.isHasError());
        }

        long executionTime = System.currentTimeMillis() - startTime;
        context.setExecutionTimeMs(executionTime);
        log.info("Pipeline: Complete in {}ms", executionTime);

        return context;
    }
}
