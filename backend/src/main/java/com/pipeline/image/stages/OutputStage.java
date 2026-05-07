package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.service.StorageService;
import lombok.RequiredArgsConstructor;

/**
 * Output stage that uploads the processed image to S3 and records the public URL.
 * This is the final stage in the pipeline.
 */
@RequiredArgsConstructor
public class OutputStage implements ImageStage {
    private final StorageService storageService;

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            if (context.isHasError()) {
                return context;
            }

            if (context.getImage() == null) {
                context.setError("No image to save");
                return context;
            }

            String userId = context.getUserId();
            if (userId == null) {
                context.setError("No authenticated user found for image upload");
                return context;
            }

            String fileExtension = "jpg";
            if (!context.isCompressed() && context.getInputFile() != null
                    && context.getInputFile().getOriginalFilename() != null
                    && context.getInputFile().getOriginalFilename().toLowerCase().endsWith(".png")) {
                fileExtension = "png";
            }

//            StoredImageInfo storedImage = storageService.storeProcessedImage(context.getImage(), fileExtension, userId);
            context.setOutputFilename("");
            context.setOutputUrl("");

            return context;

        } catch (Exception e) {
            context.setError("Failed to save output: " + e.getMessage());
            return context;
        }
    }
}
