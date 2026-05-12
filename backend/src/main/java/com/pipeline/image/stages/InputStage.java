package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

public class InputStage implements ImageStage {

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            if (context.getInputFile().isEmpty()) {
                context.setError("File is empty");
                return context;
            }

            String contentType = context.getInputFile().getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                context.setError("Only JPEG and PNG files are supported");
                return context;
            }

            BufferedImage image = ImageIO.read(context.getInputFile().getInputStream());
            if (image == null) {
                context.setError("Invalid image file - could not read");
                return context;
            }

            context.setImage(image);
            return context;

        } catch (Exception e) {
            context.setError("Failed to process input: " + e.getMessage());
            return context;
        }
    }
}
