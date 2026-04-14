package com.pipeline.image.config;

import com.pipeline.image.core.ImageStage;
import com.pipeline.image.stages.CompressionStage;
import com.pipeline.image.stages.FilterStage;
import com.pipeline.image.stages.InputStage;
import com.pipeline.image.stages.OutputStage;
import com.pipeline.image.stages.ResizeStage;
import com.pipeline.image.stages.WatermarkStage;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
public class StageBeanConfig {

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ImageStage inputStage() {
        return new InputStage();
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ImageStage resizeStage(Integer targetWidth, Integer targetHeight) {
        return new ResizeStage(targetWidth, targetHeight);
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ImageStage filterStage(String filterType, Float brightnessLevel) {
        return new FilterStage(filterType, brightnessLevel);
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ImageStage watermarkStage(String text, String position, Integer size) {
        return new WatermarkStage(text, position, size);
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ImageStage compressionStage(Float quality) {
        return new CompressionStage(quality);
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ImageStage outputStage(String storageDir, String originalQuality) {
        return new OutputStage(storageDir, originalQuality);
    }
}
