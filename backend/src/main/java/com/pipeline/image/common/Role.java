package com.pipeline.image.common;

import lombok.Getter;

@Getter
public enum Role {

    ADMIN("ADMIN"), USER("USER");

    private final String value;

    Role(String value) {
        this.value = value;
    }
}
