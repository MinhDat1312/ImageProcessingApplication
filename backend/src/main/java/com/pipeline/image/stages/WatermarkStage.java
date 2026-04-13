package com.pipeline.image.stages;

import com.pipeline.image.core.ImageStage;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

/**
 * Adds a text watermark to the image.
 */
public class WatermarkStage implements ImageStage {
    private final String text;
    private final String position;
    private final int size;

    public WatermarkStage(String text, String position, int size) {
        this.text = text;
        this.position = position != null ? position : "bottom-right";
        this.size = size > 0 ? size : 30; // default font size
    }

    @Override
    public BufferedImage process(BufferedImage input) throws Exception {
        if (text == null || text.trim().isEmpty()) {
            return input;
        }

        BufferedImage watermarked = new BufferedImage(input.getWidth(), input.getHeight(), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = (Graphics2D) watermarked.getGraphics();
        
        g2d.drawImage(input, 0, 0, null);
        AlphaComposite alphaChannel = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.5f);
        g2d.setComposite(alphaChannel);
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("Arial", Font.BOLD, size));
        FontMetrics fontMetrics = g2d.getFontMetrics();
        
        int x = 0;
        int y = 0;
        int textWidth = fontMetrics.stringWidth(text);
        int textHeight = fontMetrics.getHeight();

        switch (position.toLowerCase()) {
            case "top-left":
                x = 10;
                y = textHeight;
                break;
            case "top-right":
                x = input.getWidth() - textWidth - 10;
                y = textHeight;
                break;
            case "center":
                x = (input.getWidth() - textWidth) / 2;
                y = (input.getHeight() - textHeight) / 2;
                break;
            case "bottom-left":
                x = 10;
                y = input.getHeight() - 10;
                break;
            case "bottom-right":
            default:
                x = input.getWidth() - textWidth - 10;
                y = input.getHeight() - 10;
                break;
        }

        g2d.drawString(text, x, y);
        g2d.dispose();
        
        return watermarked;
    }
}
