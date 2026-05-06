package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import net.coobird.thumbnailator.Thumbnails;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

/**
 * Compresses the image using JPEG with the specified quality (0.1 to 1.0).
 */
public class CompressionStage implements ImageStage {
    private final float quality;

    public CompressionStage(float quality) {
        // Ensure quality is within valid bounds
        if (quality < 0.1f) this.quality = 0.1f;
        else if (quality > 1.0f) this.quality = 1.0f;
        else this.quality = quality;
    }

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            if (context.isHasError()) {
                return context;
            }

            BufferedImage input = context.getImage();
            if (input == null) {
                context.setError("No image to compress");
                return context;
            }

            // Thumbnailator supports quality setting if output format is JPEG
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Thumbnails.of(input)
                    .scale(1.0)
                    .outputFormat("jpg")
                    .outputQuality(quality)
                    .toOutputStream(baos);

            BufferedImage compressed = ImageIO.read(new ByteArrayInputStream(baos.toByteArray()));
            context.setImage(compressed);
            context.setCompressed(true);
            return context;

        } catch (Exception e) {
            context.setError("Compression failed: " + e.getMessage());
            return context;
        }
    }
}
