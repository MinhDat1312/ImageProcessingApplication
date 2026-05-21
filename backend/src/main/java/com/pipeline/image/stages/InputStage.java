package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import lombok.extern.slf4j.Slf4j;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

@Slf4j
public class InputStage implements ImageStage {

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            log.info("InputStage: Starting");

            if (context.getInputFile().isEmpty()) {
                context.setError("File is empty");
                return context;
            }
            log.info("InputStage: File not empty");

            String contentType = context.getInputFile().getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                context.setError("Only JPEG and PNG files are supported");
                return context;
            }
            log.info("InputStage: Content type valid - {}", contentType);

            log.info("InputStage: Reading image...");
            BufferedImage image = ImageIO.read(context.getInputFile().getInputStream());
            log.info("InputStage: Image read - {}x{}", image != null ? image.getWidth() : 0, image != null ? image.getHeight() : 0);

            if (image == null) {
                context.setError("Invalid image file - could not read");
                return context;
            }

            context.setImage(image);
            log.info("InputStage: Complete");
            return context;

        } catch (Exception e) {
            log.error("InputStage: Failed", e);
            context.setError("Failed to process input: " + e.getMessage());
            return context;
        }
    }
}
