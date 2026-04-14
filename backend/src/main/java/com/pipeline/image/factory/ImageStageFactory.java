package com.pipeline.image.factory;

import com.pipeline.image.core.ImageStage;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ImageStageFactory {
    private final ApplicationContext applicationContext;

    public ImageStageFactory(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    public ImageStage createInputStage() {
        return applicationContext.getBean("inputStage", ImageStage.class);
    }

    public ImageStage createResizeStage(int targetWidth, int targetHeight) {
        return (ImageStage) applicationContext.getBean("resizeStage", targetWidth, targetHeight);
    }

    public ImageStage createFilterStage(String filterType, float brightnessLevel) {
        return (ImageStage) applicationContext.getBean("filterStage", filterType, brightnessLevel);
    }

    public ImageStage createWatermarkStage(String text, String position, int size) {
        return (ImageStage) applicationContext.getBean("watermarkStage", text, position, size);
    }

    public ImageStage createCompressionStage(float quality) {
        return (ImageStage) applicationContext.getBean("compressionStage", quality);
    }

    public ImageStage createOutputStage(String storageDir, String originalQuality) {
        return (ImageStage) applicationContext.getBean("outputStage", storageDir, originalQuality);
    }
}
