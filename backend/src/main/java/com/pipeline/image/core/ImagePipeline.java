package com.pipeline.image.core;

import java.util.ArrayList;
import java.util.List;

/**
 * Pipeline manager that maintains a list of stages and executes them sequentially.
 * Passes a PipelineContext object through all stages.
 */
public class ImagePipeline {
    private final List<ImageStage> stages = new ArrayList<>();

    public void addStage(ImageStage stage) {
        stages.add(stage);
    }

    public PipelineContext execute(PipelineContext context) throws Exception {
        long startTime = System.currentTimeMillis();
        
        for (ImageStage stage : stages) {
            if (context.isHasError()) {
                break; // Stop processing if error occurred
            }
            context = stage.process(context);
        }
        
        long executionTime = System.currentTimeMillis() - startTime;
        context.setExecutionTimeMs(executionTime);
        
        return context;
    }
}
