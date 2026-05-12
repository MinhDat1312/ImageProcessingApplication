package com.pipeline.image.core;

public interface ImageStage {
    PipelineContext process(PipelineContext context) throws Exception;
}
