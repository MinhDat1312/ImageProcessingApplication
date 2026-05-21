package com.pipeline.image.service;

import com.pipeline.image.dto.response.ImageFeedItem;
import com.pipeline.image.entity.Image;
import com.pipeline.image.entity.User;
import com.pipeline.image.repository.ImageCommentRepository;
import com.pipeline.image.repository.ImageLikeRepository;
import com.pipeline.image.repository.ImageRepository;
import com.pipeline.image.repository.ImageSaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {
    private final ImageRepository imageRepository;
    private final ImageLikeRepository imageLikeRepository;
    private final ImageCommentRepository imageCommentRepository;
    private final ImageSaveRepository imageSaveRepository;

    // simple in-memory rate limiter for views: key -> lastTimestamp
    private final Map<String, Long> lastView = new ConcurrentHashMap<>();
    private final long VIEW_COOLDOWN_MS = 60 * 1000; // 60 seconds per client per image

    public Page<Image> getPublicImages(Pageable pageable) {
        return imageRepository.findByVisibilityOrderByCreatedAtDesc(com.pipeline.image.common.Visibility.PUBLIC, pageable);
    }

    public List<ImageFeedItem> toFeedItems(Page<Image> page, Optional<User> currentUserOpt) {
        List<String> ids = page.getContent().stream().map(Image::getImageId).collect(Collectors.toList());
        Set<String> likedSet = new HashSet<>();
        if (currentUserOpt.isPresent() && !ids.isEmpty()) {
            List<com.pipeline.image.entity.ImageLike> likes = imageLikeRepository.findByImage_ImageIdInAndUser_UserId(ids, currentUserOpt.get().getUserId());
            likedSet.addAll(likes.stream().map(l -> l.getImage().getImageId()).collect(Collectors.toSet()));
        }

        return page.getContent().stream().map(image -> {
            ImageFeedItem it = new ImageFeedItem();
            it.setId(image.getImageId());
            it.setUrl(image.getUrl());
            it.setThumbnail(image.getThumbnailUrl());
            it.setTitle(image.getTitle());
            it.setPrompt(image.getPrompt());
            it.setTags(image.getTags());
            it.setCreatedAt(image.getCreatedAt());
            it.setLikes(image.getLikesCount());
            it.setViews(image.getViewsCount());
            it.setComments(image.getCommentsCount());
            if (image.getUser() != null) {
                it.setOwnerId(image.getUser().getUserId());
                it.setOwnerName(image.getUser().getUsername());
                it.setOwnerAvatar(image.getUser().getAvatar());
            }
            it.setLikedByCurrentUser(likedSet.contains(image.getImageId()));
            return it;
        }).collect(Collectors.toList());
    }

    @Transactional
    public long likeImage(Image image, User user) {
        Optional<com.pipeline.image.entity.ImageLike> existing = imageLikeRepository.findByImage_ImageIdAndUser_UserId(image.getImageId(), user.getUserId());
        if (existing.isPresent()) return image.getLikesCount() == null ? 1L : image.getLikesCount();
        com.pipeline.image.entity.ImageLike like = new com.pipeline.image.entity.ImageLike();
        like.setImage(image);
        like.setUser(user);
        imageLikeRepository.save(like);
        image.setLikesCount(image.getLikesCount() == null ? 1L : image.getLikesCount() + 1);
        imageRepository.save(image);
        return image.getLikesCount();
    }

    @Transactional
    public long unlikeImage(Image image, User user) {
        Optional<com.pipeline.image.entity.ImageLike> existing = imageLikeRepository.findByImage_ImageIdAndUser_UserId(image.getImageId(), user.getUserId());
        if (existing.isEmpty()) return image.getLikesCount() == null ? 0L : image.getLikesCount();
        imageLikeRepository.delete(existing.get());
        image.setLikesCount(Math.max(0L, image.getLikesCount() == null ? 0L : image.getLikesCount() - 1));
        imageRepository.save(image);
        return image.getLikesCount();
    }

    @Transactional
    public long commentImage(Image image, User user, String content) {
        com.pipeline.image.entity.ImageComment comment = new com.pipeline.image.entity.ImageComment();
        comment.setImage(image);
        comment.setUser(user);
        comment.setContent(content);
        imageCommentRepository.save(comment);
        image.setCommentsCount(image.getCommentsCount() == null ? 1L : image.getCommentsCount() + 1);
        imageRepository.save(image);
        return image.getCommentsCount();
    }

    /**
     * Increment view count with simple cooldown per clientKey (userId or IP).
     * Returns current views count.
     */
    @Transactional
    public long viewImage(Image image, String clientKey) {
        String key = image.getImageId() + "::" + clientKey;
        long now = System.currentTimeMillis();
        Long last = lastView.get(key);
        if (last != null && (now - last) < VIEW_COOLDOWN_MS) {
            return image.getViewsCount() == null ? 0L : image.getViewsCount();
        }
        lastView.put(key, now);
        image.setViewsCount(image.getViewsCount() == null ? 1L : image.getViewsCount() + 1);
        imageRepository.save(image);
        return image.getViewsCount();
    }
}
