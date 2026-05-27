package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.io.ByteArrayOutputStream;
import java.util.Iterator;

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
            if (!writeImage(context.getImage(), fileExtension, outputStream)) {
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

    private boolean writeImage(java.awt.image.BufferedImage image, String fileExtension, ByteArrayOutputStream outputStream) throws Exception {
        if (!"jpg".equalsIgnoreCase(fileExtension) && !"jpeg".equalsIgnoreCase(fileExtension)) {
            return ImageIO.write(image, fileExtension, outputStream);
        }

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            return false;
        }

        java.awt.image.BufferedImage rgbImage = image;
        if (image.getColorModel().hasAlpha()) {
            rgbImage = new java.awt.image.BufferedImage(image.getWidth(), image.getHeight(), java.awt.image.BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = rgbImage.createGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
            graphics.drawImage(image, 0, 0, null);
            graphics.dispose();
        }

        ImageWriter writer = writers.next();
        try (ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(outputStream)) {
            ImageWriteParam params = writer.getDefaultWriteParam();
            if (params.canWriteCompressed()) {
                params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                params.setCompressionQuality(1.0f);
            }
            writer.setOutput(imageOutputStream);
            writer.write(null, new javax.imageio.IIOImage(rgbImage, null, null), params);
            return true;
        } finally {
            writer.dispose();
        }
    }
}
