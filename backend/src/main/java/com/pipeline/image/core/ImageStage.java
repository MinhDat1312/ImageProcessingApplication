package com.pipeline.image.core;

/**
 * Interface representing a single stage in the image processing pipeline.
 * Each stage receives a PipelineContext, processes it, and returns the modified context.
 */
public interface ImageStage {
    /**
     * Processes the pipeline context and updates it accordingly.
     *
     * @param context The pipeline context containing image data and metadata
     * @return The processed context
     */
    PipelineContext process(PipelineContext context) throws Exception;
}
