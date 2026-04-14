package com.pipeline.image;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ImageProcessingApplication {
    public static void main(String[] args) {
        SpringApplication.run(ImageProcessingApplication.class, args);
    }
}
