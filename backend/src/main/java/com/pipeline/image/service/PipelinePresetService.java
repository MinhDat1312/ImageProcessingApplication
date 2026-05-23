package com.pipeline.image.service;

import com.pipeline.image.dto.request.PipelinePresetRequestDto;
import com.pipeline.image.dto.response.PipelinePresetResponseDto;
import com.pipeline.image.entity.PipelinePreset;
import com.pipeline.image.entity.User;
import com.pipeline.image.exception.NotFoundException;
import com.pipeline.image.exception.PermissionException;
import com.pipeline.image.repository.PipelinePresetRepository;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelinePresetService {

    private final PipelinePresetRepository pipelinePresetRepository;
    private final UserRepository userRepository;

    public List<PipelinePresetResponseDto> getAllPresets() throws NotFoundException {
        String email = SecurityUtil.getCurrentUserEmail();
        if (email == null || email.isBlank()) {
            throw new NotFoundException("User is not authenticated");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        List<PipelinePreset> presets = pipelinePresetRepository.findByUser_UserIdOrderByCreatedAtDesc(user.getUserId());
        return presets.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PipelinePresetResponseDto createPreset(PipelinePresetRequestDto dto) throws NotFoundException {
        String email = SecurityUtil.getCurrentUserEmail();
        if (email == null || email.isBlank()) {
            throw new NotFoundException("User is not authenticated");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));

        PipelinePreset preset = new PipelinePreset();
        preset.setName(dto.getName());
        preset.setStepsJson(dto.getStepsJson());
        preset.setUser(user);

        PipelinePreset savedPreset = pipelinePresetRepository.save(preset);
        log.info("Saved custom pipeline preset '{}' for user {}", savedPreset.getName(), email);
        return mapToDto(savedPreset);
    }

    public void deletePreset(String id) throws NotFoundException, PermissionException {
        String email = SecurityUtil.getCurrentUserEmail();
        if (email == null || email.isBlank()) {
            throw new NotFoundException("User is not authenticated");
        }

        PipelinePreset preset = pipelinePresetRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Preset not found with id " + id));

        if (!preset.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new PermissionException("You do not have permission to delete this preset");
        }

        pipelinePresetRepository.delete(preset);
        log.info("Deleted custom pipeline preset '{}' for user {}", preset.getName(), email);
    }

    private PipelinePresetResponseDto mapToDto(PipelinePreset preset) {
        return PipelinePresetResponseDto.builder()
                .id(preset.getId())
                .name(preset.getName())
                .stepsJson(preset.getStepsJson())
                .createdAt(preset.getCreatedAt())
                .build();
    }
}
