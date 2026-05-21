package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;

@Slf4j
@RequiredArgsConstructor
public class OutputStage implements ImageStage {
    private final StorageService storageService;

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            log.info("OutputStage: Starting");
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
            log.info("OutputStage: User ID - {}", userId);

            String fileExtension = "jpg";
            String originalFilename = context.getInputFile() != null ? context.getInputFile().getOriginalFilename() : null;
            if (!context.isCompressed() && originalFilename != null && originalFilename.toLowerCase().endsWith(".png")) {
                fileExtension = "png";
            }
            log.info("OutputStage: File extension - {}", fileExtension);

            log.info("OutputStage: Writing image to byte array...");
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            if (!ImageIO.write(context.getImage(), fileExtension, outputStream)) {
                context.setError("Unsupported output image format: " + fileExtension);
                return context;
            }
            log.info("OutputStage: Image written, size - {} bytes", outputStream.size());

            String outputFilename = String.format("processed-%s.%s", userId, fileExtension);
            MockMultipartFile multipartFile = new MockMultipartFile(
                    "file",
                    outputFilename,
                    "image/" + ("png".equalsIgnoreCase(fileExtension) ? "png" : "jpeg"),
                    outputStream.toByteArray()
            );

            log.info("OutputStage: Uploading to S3...");
            var storedImage = storageService.handleUploadFile(multipartFile, userId).join();
            log.info("OutputStage: Upload complete - {}", storedImage.getUrl());

            context.setOutputFilename(outputFilename);
            context.setOutputUrl(storedImage.getUrl());

            log.info("OutputStage: Complete");
            return context;

        } catch (Exception e) {
            log.error("OutputStage: Failed", e);
            context.setError("Failed to save output: " + e.getMessage());
            return context;
        }
    }
}
