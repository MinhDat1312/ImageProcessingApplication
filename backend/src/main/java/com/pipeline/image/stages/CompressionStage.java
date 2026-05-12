package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import net.coobird.thumbnailator.Thumbnails;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

public class CompressionStage implements ImageStage {
    private final float quality;

    public CompressionStage(float quality) {
        if (quality < 0.1f) this.quality = 0.1f;
        else this.quality = Math.min(quality, 1.0f);
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
