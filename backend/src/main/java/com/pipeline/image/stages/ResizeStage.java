package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
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
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            if (context.isHasError()) {
                return context;
            }

            BufferedImage input = context.getImage();
            if (input == null) {
                context.setError("No image to resize");
                return context;
            }

            if (targetWidth <= 0 || targetHeight <= 0) {
                return context; // Skip if invalid dimensions
            }

            BufferedImage resized = Thumbnails.of(input)
                    .forceSize(targetWidth, targetHeight)
                    .asBufferedImage();

            context.setImage(resized);
            return context;

        } catch (Exception e) {
            context.setError("Resize failed: " + e.getMessage());
            return context;
        }
    }
}
