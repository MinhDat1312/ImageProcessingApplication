package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;

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
            String originalFilename = context.getInputFile() != null ? context.getInputFile().getOriginalFilename() : null;
            if (!context.isCompressed() && originalFilename != null && originalFilename.toLowerCase().endsWith(".png")) {
                fileExtension = "png";
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            if (!ImageIO.write(context.getImage(), fileExtension, outputStream)) {
                context.setError("Unsupported output image format: " + fileExtension);
                return context;
            }

            String outputFilename = String.format("processed-%s.%s", userId, fileExtension);
            MockMultipartFile multipartFile = new MockMultipartFile(
                    "file",
                    outputFilename,
                    "image/" + ("png".equalsIgnoreCase(fileExtension) ? "png" : "jpeg"),
                    outputStream.toByteArray()
            );

            var storedImage = storageService.handleUploadFile(multipartFile, userId).join();
            context.setOutputFilename(outputFilename);
            context.setOutputUrl(storedImage.getUrl());

            return context;

        } catch (Exception e) {
            context.setError("Failed to save output: " + e.getMessage());
            return context;
        }
    }
}
