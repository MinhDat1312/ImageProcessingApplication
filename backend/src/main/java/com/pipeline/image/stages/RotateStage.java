package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.core.PipelineContext;
import lombok.extern.slf4j.Slf4j;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

@Slf4j
public class RotateStage implements ImageStage {
    private final Integer rotateAngle; // 90, 180, 270

    public RotateStage(Integer rotateAngle) {
        this.rotateAngle = rotateAngle;
    }

    @Override
    public PipelineContext process(PipelineContext context) throws Exception {
        try {
            if (context.isHasError()) {
                return context;
            }

            BufferedImage input = context.getImage();
            if (input == null) {
                context.setError("No image to rotate");
                return context;
            }

            if (rotateAngle == null || rotateAngle % 360 == 0) {
                return context;
            }

            int angle = rotateAngle % 360;
            if (angle < 0) angle += 360;

            int w = input.getWidth();
            int h = input.getHeight();

            int newW = w;
            int newH = h;
            if (angle == 90 || angle == 270) {
                newW = h;
                newH = w;
            }

            BufferedImage rotated = new BufferedImage(newW, newH, input.getType() == 0 ? BufferedImage.TYPE_INT_ARGB : input.getType());
            Graphics2D g2d = rotated.createGraphics();

            if (angle == 90) {
                g2d.translate(newW, 0);
                g2d.rotate(Math.toRadians(90));
            } else if (angle == 180) {
                g2d.translate(newW, newH);
                g2d.rotate(Math.toRadians(180));
            } else if (angle == 270) {
                g2d.translate(0, newH);
                g2d.rotate(Math.toRadians(270));
            } else {
                // Arbitrary rotation fallback
                g2d.translate((newW - w) / 2.0, (newH - h) / 2.0);
                g2d.rotate(Math.toRadians(angle), w / 2.0, h / 2.0);
            }

            g2d.drawImage(input, 0, 0, null);
            g2d.dispose();

            log.info("Rotated image by {} degrees", angle);
            context.setImage(rotated);
            return context;
        } catch (Exception e) {
            log.error("Rotation failed", e);
            context.setError("Rotation failed: " + e.getMessage());
            return context;
        }
    }
}
