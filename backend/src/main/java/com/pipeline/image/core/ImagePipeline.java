package com.pipeline.image.core;

import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.List;

/**
 * Pipeline manager that maintains a list of stages and executes them sequentially.
 */
public class ImagePipeline {
    private final List<ImageStage> stages = new ArrayList<>();

    public void addStage(ImageStage stage) {
        stages.add(stage);
    }

    public BufferedImage execute(BufferedImage input) throws Exception {
        BufferedImage currentImage = input;
        for (ImageStage stage : stages) {
            currentImage = stage.process(currentImage);
        }
        return currentImage;
    }
}
