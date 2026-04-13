package com.pipeline.image.core;

import java.awt.image.BufferedImage;

/**
 * Interface representing a single stage in the image processing pipeline.
 */
public interface ImageStage {
    /**
     * Processes the input image and returns the result.
     *
     * @param input The image to process
     * @return The processed image
     */
    BufferedImage process(BufferedImage input) throws Exception;
}
