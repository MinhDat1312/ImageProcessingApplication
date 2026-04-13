package com.pipeline.image.core;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;

/**
 * Context object that flows through the entire image processing pipeline.
 * Contains input file, processing state, and output metadata.
 */
@Data
public class PipelineContext {
    // Input
    private MultipartFile inputFile;
    
    // Image data
    private BufferedImage image;
    
    // Output metadata
    private String outputFilename;
    private String outputUrl;
    private long executionTimeMs;
    
    // Error handling
    private boolean hasError;
    private String errorMessage;

    public PipelineContext(MultipartFile inputFile) {
        this.inputFile = inputFile;
        this.hasError = false;
    }

    public void setError(String errorMessage) {
        this.hasError = true;
        this.errorMessage = errorMessage;
    }
}
