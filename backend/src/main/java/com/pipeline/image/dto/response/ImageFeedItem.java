package com.pipeline.image.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ImageFeedItem {
    private String id;
    private String url;
    private String thumbnail;
    private String title;
    private String prompt;
    private String tags;
    private String description;
    private Instant createdAt;
    private Long likes;
    private Long views;
    private Long comments;
    private String ownerId;
    private String ownerName;
    private String ownerAvatar;
    private boolean likedByCurrentUser;
    private String visibility;
}
