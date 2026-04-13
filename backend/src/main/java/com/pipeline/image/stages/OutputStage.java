package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.imageio.ImageIO;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Output stage that saves the processed image to disk and generates a download URL.
 * This is the final stage in the pipeline.
 */
public class OutputStage implements ImageStage {
    private final String storageDir;
    private final String originalQuality;

    public OutputStage(String storageDir, String originalQuality) {
        this.storageDir = storageDir;
        this.originalQuality = originalQuality;
    }

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

            // 1. Create storage directory if it doesn't exist
            Path storagePath = Paths.get(storageDir);
            if (!Files.exists(storagePath)) {
                Files.createDirectories(storagePath);
            }

            // 2. Determine file extension and generate random filename
            String originalFilename = context.getInputFile().getOriginalFilename();
            String fileExtension = "jpg"; // Default output format due to potential compression
            
            // Keep PNG format only if original is PNG and quality is not compressed (1.0)
            if (originalFilename != null && originalFilename.toLowerCase().endsWith(".png") 
                    && (originalQuality == null || originalQuality.equals("1.0"))) {
                fileExtension = "png";
            }

            String newFilename = UUID.randomUUID().toString() + "." + fileExtension;
            File outputFile = storagePath.resolve(newFilename).toFile();

            // 3. Save image to disk
            ImageIO.write(context.getImage(), fileExtension.equals("png") ? "png" : "jpg", outputFile);

            // 4. Generate download URL
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/images/download/")
                    .path(newFilename)
                    .toUriString();

            // 5. Update context with output metadata
            context.setOutputFilename(newFilename);
            context.setOutputUrl(fileDownloadUri);

            return context;

        } catch (Exception e) {
            context.setError("Failed to save output: " + e.getMessage());
            return context;
        }
    }
}
