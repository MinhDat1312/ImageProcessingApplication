package com.pipeline.image.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.pipeline.image.dto.request.assistant.AssistantRequestDto;
import com.pipeline.image.dto.response.assistant.AssistantResponseDto;
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

    @Value("${assistant.model:" + DEFAULT_MODEL + "}")
    private String modelName;

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
        return callModel("chat", systemPrompt, request);
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