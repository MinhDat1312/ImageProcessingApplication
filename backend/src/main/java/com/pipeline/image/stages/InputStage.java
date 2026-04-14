package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

/**
 * Input stage that validates the file and loads it into a BufferedImage.
 * This is the first stage in the pipeline.
 */
public class InputStage implements ImageStage {

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            // 1. Validate file exists and not empty
            if (context.getInputFile().isEmpty()) {
                context.setError("File is empty");
                return context;
            }

            // 2. Validate file type (only JPEG and PNG)
            String contentType = context.getInputFile().getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                context.setError("Only JPEG and PNG files are supported");
                return context;
            }

            // 3. Load image from stream
            BufferedImage image = ImageIO.read(context.getInputFile().getInputStream());
            if (image == null) {
                context.setError("Invalid image file - could not read");
                return context;
            }

            // 4. Set image in context for downstream processing
            context.setImage(image);
            return context;

        } catch (Exception e) {
            context.setError("Failed to process input: " + e.getMessage());
            return context;
        }
    }
}
