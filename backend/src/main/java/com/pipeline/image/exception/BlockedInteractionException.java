package com.pipeline.image.exception;

public class BlockedInteractionException extends InvalidException {
    public static final String ERROR_CODE = "BLOCKED_INTERACTION";

    public BlockedInteractionException(String message) {
        super(message);
    }
}
