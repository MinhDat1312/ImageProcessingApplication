package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import lombok.extern.slf4j.Slf4j;

import java.awt.image.BufferedImage;

@Slf4j
public class CropStage implements ImageStage {
    private final Integer x;
    private final Integer y;
    private final Integer width;
    private final Integer height;

    public CropStage(Integer x, Integer y, Integer width, Integer height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            if (context.isHasError()) {
                return context;
            }

            BufferedImage input = context.getImage();
            if (input == null) {
                context.setError("No image to crop");
                return context;
            }

            if (x == null || y == null || width == null || height == null) {
                log.info("Crop parameters missing, skipping CropStage");
                return context;
            }

            int imgW = input.getWidth();
            int imgH = input.getHeight();

            int cropX = Math.max(0, Math.min(x, imgW - 1));
            int cropY = Math.max(0, Math.min(y, imgH - 1));
            int cropW = Math.max(1, Math.min(width, imgW - cropX));
            int cropH = Math.max(1, Math.min(height, imgH - cropY));

            log.info("Cropping image to: x={}, y={}, w={}, h={}", cropX, cropY, cropW, cropH);
            BufferedImage cropped = input.getSubimage(cropX, cropY, cropW, cropH);

            // Create a copy of the subimage to prevent keeping references to original memory raster
            BufferedImage copy = new BufferedImage(cropW, cropH, input.getType() == 0 ? BufferedImage.TYPE_INT_ARGB : input.getType());
            var g = copy.createGraphics();
            g.drawImage(cropped, 0, 0, null);
            g.dispose();

            context.setImage(copy);
            return context;
        } catch (Exception e) {
            log.error("Crop stage failed", e);
            context.setError("Crop failed: " + e.getMessage());
            return context;
        }
    }
}
