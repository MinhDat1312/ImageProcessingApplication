package com.pipeline.image.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.pipeline.image.dto.request.assistant.AssistantRequestDto;
import com.pipeline.image.dto.response.assistant.AssistantResponseDto;
import com.pipeline.image.entity.User;
import com.pipeline.image.entity.ChatbotHistory;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.repository.ChatbotHistoryRepository;
import com.pipeline.image.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistantService {
    private static final String DEFAULT_MODEL = "gemini-2.5-flash";

    private final Client googleClient;
    private final UserRepository userRepository;
    private final ChatbotHistoryRepository chatbotHistoryRepository;

    @Value("${assistant.model:" + DEFAULT_MODEL + "}")
    private String modelName;

    public static class ImageAiMetadata {
        private final String description;
        private final String tags;
        public ImageAiMetadata(String description, String tags) {
            this.description = description;
            this.tags = tags;
        }
        public String getDescription() { return description; }
        public String getTags() { return tags; }
    }

    public ImageAiMetadata generateAiMetadata(String title, String details, boolean isAiGeneration) {
        String inputDetails = isAiGeneration ? "Generation Prompt: " + details : "Image Title: " + title + ", Processing: " + details;
        String systemPrompt = "You are an AI assistant for an image gallery platform. " +
                "Based on the following input, write a creative, concise description (1-2 sentences) " +
                "and generate 3-5 relevant keywords/tags (comma-separated, single words, no hashtag symbol). " +
                "Format your response exactly like this:\n" +
                "Description: [Your description]\n" +
                "Tags: [tag1, tag2, tag3]\n" +
                "Input details:\n" + inputDetails;
        
        try {
            GenerateContentResponse response = googleClient.models.generateContent("gemini-2.5-flash", systemPrompt, null);
            String text = response.text();
            if (text != null && !text.isBlank()) {
                String description = "";
                String tags = "";
                String[] lines = text.split("\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.toLowerCase().startsWith("description:")) {
                        description = trimmed.substring("description:".length()).trim();
                    } else if (trimmed.toLowerCase().startsWith("tags:")) {
                        tags = trimmed.substring("tags:".length()).trim();
                    }
                }
                if (!description.isBlank() && !tags.isBlank()) {
                    return new ImageAiMetadata(description, tags);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to generate AI metadata: {}", e.getMessage());
        }
        
        // Fallback
        String fallbackDesc = isAiGeneration ? "AI Generated image using prompt: " + details : "Processed image: " + title;
        String fallbackTags = isAiGeneration ? "ai, generated, digital-art" : "processed, edit, custom";
        return new ImageAiMetadata(fallbackDesc, fallbackTags);
    }

    public AssistantResponseDto generatePrompt(AssistantRequestDto request) {
        String systemPrompt = "You are an expert prompt engineer for AI image generation. " +
                "Create a polished image prompt from the user's idea. Return only the final prompt and no markdown.";
        return callModel("generate-prompt", systemPrompt, request);
    }

    public AssistantResponseDto improvePrompt(AssistantRequestDto request) {
        String systemPrompt = "Improve the user's prompt for AI image generation. " +
                "Preserve the original intent, add style, composition, and lighting detail. Return only the improved prompt.";
        return callModel("improve-prompt", systemPrompt, request);
    }

    public AssistantResponseDto suggestPrompt(AssistantRequestDto request) {
        String systemPrompt = "Suggest 3 concise AI image prompts based on the user's topic. " +
                "Return each prompt on a new line without bullets or markdown.";
        return callModel("suggest-prompt", systemPrompt, request);
    }

    public AssistantResponseDto explainImage(AssistantRequestDto request) {
        String systemPrompt = "Explain the visual composition, lighting, likely technique, and editing ideas for the user's image context. " +
                "Return a concise but useful explanation.";
        return callModel("explain-image", systemPrompt, request);
    }

    public AssistantResponseDto chat(AssistantRequestDto request) {
        String systemPrompt = "You are NovaCanvas AI, a context-aware assistant for image processing and image generation. " +
                "Help with prompts, negative prompts, pipeline suggestions, and image editing explanations.";

        // Retrieve current user and load history
        String email = SecurityUtil.getCurrentUserEmail();
        User currentUser = null;
        if (email != null && !email.isBlank()) {
            currentUser = userRepository.findByEmailWithRole(email).orElse(null);
        }

        StringBuilder contextBuilder = new StringBuilder();
        if (currentUser != null) {
            List<ChatbotHistory> history = chatbotHistoryRepository.findByUser_UserIdOrderByCreatedAtAsc(currentUser.getUserId());
            if (history != null && !history.isEmpty()) {
                // limit to last 20 messages for context size limit
                int start = Math.max(0, history.size() - 20);
                contextBuilder.append("Previous chat history:\n");
                for (int i = start; i < history.size(); i++) {
                    ChatbotHistory h = history.get(i);
                    contextBuilder.append(h.getRole().toUpperCase()).append(": ").append(h.getContent()).append("\n");
                }
                contextBuilder.append("\n");
            }
        }

        String fullContext = contextBuilder.toString() + (request.getContext() != null ? request.getContext() : "");
        AssistantRequestDto contextualRequest = new AssistantRequestDto();
        contextualRequest.setInput(request.getInput());
        contextualRequest.setContext(fullContext);
        contextualRequest.setNegativePrompt(request.getNegativePrompt());

        AssistantResponseDto responseDto = callModel("chat", systemPrompt, contextualRequest);

        // Save to DB
        if (currentUser != null && responseDto != null && responseDto.getContent() != null && !responseDto.getContent().isBlank()) {
            try {
                ChatbotHistory userMsg = new ChatbotHistory();
                userMsg.setUser(currentUser);
                userMsg.setRole("user");
                userMsg.setContent(request.getInput());
                chatbotHistoryRepository.save(userMsg);

                ChatbotHistory assistantMsg = new ChatbotHistory();
                assistantMsg.setUser(currentUser);
                assistantMsg.setRole("assistant");
                assistantMsg.setContent(responseDto.getContent());
                chatbotHistoryRepository.save(assistantMsg);
                log.info("Saved chatbot conversation history for user {}", currentUser.getEmail());
            } catch (Exception ex) {
                log.error("Failed to save chatbot history", ex);
            }
        }

        return responseDto;
    }

    public List<ChatbotHistory> getHistory() {
        String email = SecurityUtil.getCurrentUserEmail();
        if (email == null || email.isBlank()) {
            return List.of();
        }
        User currentUser = userRepository.findByEmailWithRole(email).orElse(null);
        if (currentUser == null) {
            return List.of();
        }
        return chatbotHistoryRepository.findByUser_UserIdOrderByCreatedAtAsc(currentUser.getUserId());
    }

    private AssistantResponseDto callModel(String mode, String systemPrompt, AssistantRequestDto request) {
        String composedPrompt = buildPrompt(systemPrompt, request);
        try {
            GenerateContentResponse response = googleClient.models.generateContent(modelName, composedPrompt, null);
            String content = response.text();
            if (content == null || content.isBlank()) {
                return fallback(mode, request);
            }

            return AssistantResponseDto.builder()
                    .mode(mode)
                    .model(modelName)
                    .content(content.trim()
                            .replace("```", "")
                            .trim())
                    .suggestions(buildSuggestions(mode, request.getInput()))
                    .fallback(false)
                    .build();
        } catch (Exception ex) {
            log.warn("Gemini request failed for mode {}: {}", mode, ex.getMessage());
            return fallback(mode, request);
        }
    }

    private String buildPrompt(String systemPrompt, AssistantRequestDto request) {
        StringBuilder builder = new StringBuilder(systemPrompt)
                .append("\n\nUser input: ")
                .append(request.getInput().trim());

        if (request.getContext() != null && !request.getContext().isBlank()) {
            builder.append("\nContext: ").append(request.getContext().trim());
        }

        if (request.getNegativePrompt() != null && !request.getNegativePrompt().isBlank()) {
            builder.append("\nNegative prompt: ").append(request.getNegativePrompt().trim());
        }

        builder.append("\n\nReturn a result suitable for an AI image platform UI.");
        return builder.toString();
    }

    private AssistantResponseDto fallback(String mode, AssistantRequestDto request) {
        String content = switch (mode) {
            case "generate-prompt" -> "Cinematic image, premium lighting, clean composition, sharp subject focus, ultra-detailed";
            case "improve-prompt" -> "Refined prompt: cinematic composition, soft volumetric light, balanced contrast, realistic textures";
            case "suggest-prompt" -> String.join("\n",
                    "Cinematic portrait, soft rim light, premium detail",
                    "Editorial product shot, dark reflections, glossy highlights",
                    "Neo-futuristic scene, neon accents, atmospheric depth");
            case "explain-image" -> "The image uses strong subject separation, directional lighting, and a clean visual hierarchy. Improve it by tightening contrast and reducing background noise.";
            default -> "I can help refine prompts, suggest pipelines, and explain image edits. Try describing the subject, style, and mood.";
        };

        return AssistantResponseDto.builder()
                .mode(mode)
                .model(modelName)
                .content(content)
                .suggestions(buildSuggestions(mode, request.getInput()))
                .fallback(true)
                .build();
    }

    private List<String> buildSuggestions(String mode, String input) {
        List<String> suggestions = new ArrayList<>();
        suggestions.add("Add style keywords");
        suggestions.add("Suggest a negative prompt");
        suggestions.add("Recommend a pipeline");

        if ("chat".equals(mode)) {
            suggestions.add("Explain lighting choices");
        }

        if (input != null && !input.isBlank()) {
            suggestions.add("Remix based on: " + input.substring(0, Math.min(32, input.length())));
        }

        return suggestions;
    }
}