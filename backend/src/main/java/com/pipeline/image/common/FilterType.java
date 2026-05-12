package com.pipeline.image.common;

import lombok.Getter;

@Getter
public enum FilterType {
    GRAYSCALE("GRAYSCALE"), SEPIA("SEPIA"), BRIGHTNESS("BRIGHTNESS"), NONE("NONE");

    private final String value;

    FilterType(String value) {
        this.value = value;
    }
}
