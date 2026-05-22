package com.pipeline.image.controller;

import com.pipeline.image.dto.request.PipelinePresetRequestDto;
import com.pipeline.image.dto.response.PipelinePresetResponseDto;
import com.pipeline.image.exception.NotFoundException;
import com.pipeline.image.exception.PermissionException;
import com.pipeline.image.service.PipelinePresetService;
import com.pipeline.image.util.annotation.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/presets")
@RequiredArgsConstructor
public class PipelinePresetController {

    private final PipelinePresetService pipelinePresetService;

    @GetMapping
    @ApiMessage("Retrieve all custom pipeline presets")
    public ResponseEntity<List<PipelinePresetResponseDto>> getAllPresets() throws NotFoundException {
        List<PipelinePresetResponseDto> presets = pipelinePresetService.getAllPresets();
        return ResponseEntity.ok(presets);
    }

    @PostMapping
    @ApiMessage("Create a custom pipeline preset")
    public ResponseEntity<PipelinePresetResponseDto> createPreset(
            @Valid @RequestBody PipelinePresetRequestDto requestDto
    ) throws NotFoundException {
        PipelinePresetResponseDto created = pipelinePresetService.createPreset(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete a custom pipeline preset")
    public ResponseEntity<Void> deletePreset(
            @PathVariable String id
    ) throws NotFoundException, PermissionException {
        pipelinePresetService.deletePreset(id);
        return ResponseEntity.ok().build();
    }
}
