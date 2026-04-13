package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import net.coobird.thumbnailator.Thumbnails;

import java.awt.image.BufferedImage;

/**
 * Resizes the image to the specified width and height.
 */
public class ResizeStage implements ImageStage {
    private final int targetWidth;
    private final int targetHeight;

    public ResizeStage(int targetWidth, int targetHeight) {
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
    }

    @Override
    public BufferedImage process(BufferedImage input) throws Exception {
        if (targetWidth <= 0 || targetHeight <= 0) {
            return input; // Skip if invalid dimensions
        }
        return Thumbnails.of(input)
                .forceSize(targetWidth, targetHeight)
                .asBufferedImage();
    }
}
