package com.pipeline.image.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipeline.image.dto.request.AIImageGenerationRequestDto;
import com.pipeline.image.entity.Image;
import com.pipeline.image.entity.ImageVersion;
import com.pipeline.image.entity.User;
import com.pipeline.image.common.Visibility;
import com.pipeline.image.repository.ImageRepository;
import com.pipeline.image.repository.ImageVersionRepository;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIImageGenerationService {

    @Value("${google.api.fal.key}")
    private String falApiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final StorageService storageService;
    private final ImageRepository imageRepository;
    private final ImageVersionRepository imageVersionRepository;
    private final UserRepository userRepository;
    private final AssistantService assistantService;

    public Image generateAIImage(AIImageGenerationRequestDto requestDto) {
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new RuntimeException("User not authenticated or found"));

        byte[] imgBytes;
        boolean isFallback = false;

        try {
            log.info("Requesting AI Image Generation for user: {}, prompt: '{}'", currentUser.getEmail(), requestDto.getPrompt());
            imgBytes = generateFalImage(requestDto.getPrompt(), requestDto.getAspectRatio());
            log.info("AI Image successfully generated via Fal.ai");
        } catch (Exception ex) {
            log.warn("Fal.ai generation failed: {}, using fallback canvas", ex.getMessage());
            imgBytes = generateFallbackImage(requestDto.getPrompt());
            isFallback = true;
        }

        // Upload to S3
        String filename = String.format("ai-%s-%s.png", currentUser.getUserId(), UUID.randomUUID());
        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                filename,
                "image/png",
                imgBytes
        );

        var storedImage = storageService.handleUploadFile(multipartFile, currentUser.getUserId()).join();
        String imageUrl = storedImage.getUrl();
        log.info("AI Image uploaded to S3: {}", imageUrl);

        // Save Image entity
        Image image = new Image();
        image.setUser(currentUser);
        image.setUrl(imageUrl);
        image.setPrompt(requestDto.getPrompt());
        
        String title = requestDto.getTitle();
        if (title == null || title.trim().isEmpty()) {
            title = requestDto.getPrompt().substring(0, Math.min(30, requestDto.getPrompt().length())) + "...";
        }
        image.setTitle(title);
        
        // Generate description and tags using AI
        try {
            AssistantService.ImageAiMetadata aiMetadata = assistantService.generateAiMetadata(title, requestDto.getPrompt(), true);
            image.setDescription(aiMetadata.getDescription());
            image.setTags(aiMetadata.getTags());
        } catch (Exception ex) {
            log.warn("Failed to generate AI metadata for generated image, using fallback", ex);
            image.setDescription("AI Generated using Imagen 3 model. Prompt: " + requestDto.getPrompt());
            image.setTags("ai, generated, digital-art");
        }
        
        image.setVisibility(Visibility.PUBLIC);
        
        // Try reading dimensions
        try {
            BufferedImage bimg = ImageIO.read(multipartFile.getInputStream());
            if (bimg != null) {
                image.setWidth(bimg.getWidth());
                image.setHeight(bimg.getHeight());
            }
        } catch (IOException e) {
            image.setWidth(1024);
            image.setHeight(1024);
        }

        Image savedImage = imageRepository.save(image);

        // Save ImageVersion
        ImageVersion version = new ImageVersion();
        version.setImage(savedImage);
        version.setVersionNumber(1);
        version.setUrl(imageUrl);
        version.setWidth(image.getWidth());
        version.setHeight(image.getHeight());
        version.setFileSize((long) imgBytes.length);
        version.setVersionType("AI_GENERATED");
        version.setPipelineStepsJson(isFallback ? "{\"model\":\"programmatic-fallback\"}" : "{\"model\":\"fal-ai-flux\"}");
        imageVersionRepository.save(version);

        return savedImage;
    }

    private byte[] generateFallbackImage(String prompt) {
        int width = 1024;
        int height = 1024;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();

        // Enable anti-aliasing
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Draw a beautiful dark neon gradient background
        GradientPaint gp = new GradientPaint(0, 0, new Color(15, 12, 75), width, height, new Color(18, 18, 18));
        g2d.setPaint(gp);
        g2d.fillRect(0, 0, width, height);

        // Draw some random abstract neon circles/blobs in background
        g2d.setColor(new Color(255, 0, 128, 40));
        g2d.fillOval(100, 200, 500, 500);
        g2d.setColor(new Color(0, 191, 255, 40));
        g2d.fillOval(400, 300, 600, 600);

        // Draw some glassmorphism overlay card in center
        int cardW = 800;
        int cardH = 400;
        int cardX = (width - cardW) / 2;
        int cardY = (height - cardH) / 2;
        g2d.setColor(new Color(255, 255, 255, 15));
        g2d.fillRoundRect(cardX, cardY, cardW, cardH, 30, 30);
        g2d.setColor(new Color(255, 255, 255, 30));
        g2d.setStroke(new java.awt.BasicStroke(2));
        g2d.drawRoundRect(cardX, cardY, cardW, cardH, 30, 30);

        // Draw Title text
        g2d.setColor(new Color(255, 255, 255, 220));
        g2d.setFont(new Font("Monospaced", Font.BOLD, 36));
        String title = "AI Generated Image Preview";
        g2d.drawString(title, cardX + 50, cardY + 80);

        // Draw Subtitle / Mode text
        g2d.setColor(new Color(0, 255, 200, 255));
        g2d.setFont(new Font("Monospaced", Font.BOLD, 20));
        g2d.drawString("IMAGEN-3 FALLBACK CANVAS", cardX + 50, cardY + 120);

        // Draw prompt text (word wrapped)
        g2d.setColor(new Color(220, 220, 220, 200));
        g2d.setFont(new Font("Monospaced", Font.ITALIC, 24));
        
        List<String> lines = wrapText(prompt, g2d.getFontMetrics(), cardW - 100);
        int textY = cardY + 180;
        for (int i = 0; i < Math.min(lines.size(), 6); i++) {
            g2d.drawString(lines.get(i), cardX + 50, textY);
            textY += 35;
        }

        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "png", baos);
        } catch (IOException e) {
            log.error("Failed to write fallback image", e);
        }
        return baos.toByteArray();
    }

    private List<String> wrapText(String text, FontMetrics fm, int maxWidth) {
        if (text == null || text.isBlank()) return List.of("");
        String[] words = text.split("\\s+");
        List<String> lines = new ArrayList<>();
        StringBuilder currentLine = new StringBuilder();
        for (String word : words) {
            String testLine = currentLine.toString() + (currentLine.length() > 0 ? " " : "") + word;
            if (fm.stringWidth(testLine) < maxWidth) {
                currentLine.append(currentLine.length() > 0 ? " " : "").append(word);
            } else {
                lines.add(currentLine.toString());
                currentLine = new StringBuilder(word);
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines;
    }

    private byte[] generateFalImage(String prompt, String aspectRatio) {
        try {
            String imageSize = switch (aspectRatio) {
                case "16:9" -> "landscape_16_9";
                case "9:16" -> "portrait_16_9";
                case "4:3" -> "landscape_4_3";
                default -> "square_hd";
            };

            String submitUrl = "https://queue.fal.run/fal-ai/flux-1/schnell";

            String body = """
            {
            "prompt": "%s",
            "image_size": "%s",
            "num_images": 1,
            "enable_safety_checker": true
            }
            """.formatted(prompt.replace("\"", "\\\""), imageSize);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(submitUrl))
                    .header("Authorization", "Key " + falApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Fal submit failed: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            String requestId = json.get("request_id").asText();

            String resultUrl = "https://queue.fal.run/fal-ai/flux-1/schnell/requests/" + requestId;

            for (int i = 0; i < 30; i++) {
                Thread.sleep(1000);

                HttpRequest resultRequest = HttpRequest.newBuilder()
                        .uri(URI.create(resultUrl))
                        .header("Authorization", "Key " + falApiKey)
                        .GET()
                        .build();

                HttpResponse<String> resultResponse =
                        client.send(resultRequest, HttpResponse.BodyHandlers.ofString());

                if (resultResponse.statusCode() == 200) {
                    JsonNode resultJson = objectMapper.readTree(resultResponse.body());

                    if (resultJson.has("images")) {
                        String imageUrl = resultJson.get("images").get(0).get("url").asText();
                        return downloadImage(imageUrl);
                    }
                }
            }

            throw new RuntimeException("Fal image generation timeout");

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate image via Fal AI", e);
        }
    }

    private byte[] downloadImage(String imageUrl) {
        try {
            HttpClient client = HttpClient.newHttpClient();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(imageUrl))
                    .GET()
                    .build();

            HttpResponse<byte[]> response =
                    client.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Download image failed");
            }

            return response.body();

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
