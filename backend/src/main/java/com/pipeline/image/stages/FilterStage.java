package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.awt.image.RescaleOp;

/**
 * Applies a filter to the image (grayscale, sepia, or brightness).
 */
public class FilterStage implements ImageStage {
    private final String filterType;
    private final float brightnessLevel; // 1.0 is default, >1 brighter, <1 darker

    public FilterStage(String filterType, float brightnessLevel) {
        this.filterType = filterType != null ? filterType.toLowerCase() : "none";
        this.brightnessLevel = brightnessLevel > 0 ? brightnessLevel : 1.0f;
    }

    @Override
    public BufferedImage process(BufferedImage input) throws Exception {
        BufferedImage output = input;

        switch (filterType) {
            case "grayscale":
                output = applyGrayscale(output);
                break;
            case "sepia":
                output = applySepia(output);
                break;
            case "brightness":
                output = applyBrightness(output);
                break;
            case "none":
            default:
                break;
        }

        return output;
    }

    private BufferedImage applyGrayscale(BufferedImage img) {
        BufferedImage result = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < img.getHeight(); y++) {
            for (int x = 0; x < img.getWidth(); x++) {
                Color c = new Color(img.getRGB(x, y));
                int gray = (int) (c.getRed() * 0.299 + c.getGreen() * 0.587 + c.getBlue() * 0.114);
                Color newColor = new Color(gray, gray, gray);
                result.setRGB(x, y, newColor.getRGB());
            }
        }
        return result;
    }

    private BufferedImage applySepia(BufferedImage img) {
        BufferedImage result = new BufferedImage(img.getWidth(), img.getHeight(), BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < img.getHeight(); y++) {
            for (int x = 0; x < img.getWidth(); x++) {
                Color c = new Color(img.getRGB(x, y));
                int r = c.getRed();
                int g = c.getGreen();
                int b = c.getBlue();

                int tr = (int)(0.393 * r + 0.769 * g + 0.189 * b);
                int tg = (int)(0.349 * r + 0.686 * g + 0.168 * b);
                int tb = (int)(0.272 * r + 0.534 * g + 0.131 * b);

                if(tr > 255){ r = 255; } else { r = tr; }
                if(tg > 255){ g = 255; } else { g = tg; }
                if(tb > 255){ b = 255; } else { b = tb; }

                Color newColor = new Color(r, g, b);
                result.setRGB(x, y, newColor.getRGB());
            }
        }
        return result;
    }

    private BufferedImage applyBrightness(BufferedImage img) {
        BufferedImage result = new BufferedImage(img.getWidth(), img.getHeight(), img.getType() == 0 ? BufferedImage.TYPE_INT_ARGB : img.getType());
        RescaleOp op = new RescaleOp(brightnessLevel, 0, null);
        op.filter(img, result);
        return result;
    }
}
