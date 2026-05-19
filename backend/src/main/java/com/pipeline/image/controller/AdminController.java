package com.pipeline.image.controller;

import com.pipeline.image.dto.request.admin.*;
import com.pipeline.image.dto.response.admin.*;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ── Users ─────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<Map<String, List<AdminUserResponse>>> getAllUsers() {
        return ResponseEntity.ok(Map.of("users", adminService.getAllUsers()));
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<Map<String, AdminUserResponse>> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest req) throws InvalidException {
        return ResponseEntity.ok(Map.of("user", adminService.updateUser(userId, req)));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<Map<String, String>> toggleUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody ToggleStatusRequest req) throws InvalidException {
        adminService.toggleUserStatus(userId, req.getEnabled());
        String msg = req.getEnabled() ? "Tài khoản đã kích hoạt" : "Tài khoản đã vô hiệu hóa";
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) throws InvalidException {
        adminService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }

    // ── Images ────────────────────────────────────────────────────────────

    @GetMapping("/images")
    public ResponseEntity<Map<String, List<AdminImageResponse>>> getAllImages() {
        return ResponseEntity.ok(Map.of("images", adminService.getAllImages()));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable String imageId) throws InvalidException {
        adminService.deleteImage(imageId);
        return ResponseEntity.ok().build();
    }

    // ── Roles ─────────────────────────────────────────────────────────────

    @GetMapping("/roles")
    public ResponseEntity<Map<String, List<AdminRoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(Map.of("roles", adminService.getAllRoles()));
    }

    @PostMapping("/roles")
    public ResponseEntity<Map<String, AdminRoleResponse>> createRole(
            @Valid @RequestBody CreateRoleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("role", adminService.createRole(req)));
    }

    @PatchMapping("/roles/{roleId}")
    public ResponseEntity<Map<String, AdminRoleResponse>> updateRole(
            @PathVariable String roleId,
            @Valid @RequestBody UpdateRoleRequest req) throws InvalidException {
        return ResponseEntity.ok(Map.of("role", adminService.updateRole(roleId, req)));
    }

    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(@PathVariable String roleId) throws InvalidException {
        adminService.deleteRole(roleId);
        return ResponseEntity.ok().build();
    }

    // ── Permissions ───────────────────────────────────────────────────────

    @GetMapping("/permissions")
    public ResponseEntity<Map<String, List<AdminPermissionResponse>>> getAllPermissions() {
        return ResponseEntity.ok(Map.of("permissions", adminService.getAllPermissions()));
    }

    @PostMapping("/permissions")
    public ResponseEntity<Map<String, AdminPermissionResponse>> createPermission(
            @Valid @RequestBody CreatePermissionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("permission", adminService.createPermission(req)));
    }

    @PatchMapping("/permissions/{permissionId}")
    public ResponseEntity<Map<String, AdminPermissionResponse>> updatePermission(
            @PathVariable String permissionId,
            @Valid @RequestBody UpdatePermissionRequest req) throws InvalidException {
        return ResponseEntity.ok(Map.of("permission", adminService.updatePermission(permissionId, req)));
    }

    @DeleteMapping("/permissions/{permissionId}")
    public ResponseEntity<Void> deletePermission(
            @PathVariable String permissionId) throws InvalidException {
        adminService.deletePermission(permissionId);
        return ResponseEntity.ok().build();
    }

    // ── Access Stats ──────────────────────────────────────────────────────

    @GetMapping("/access-stats")
    public ResponseEntity<AccessStatsResponse> getAccessStats(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Integer year) throws InvalidException {
        return ResponseEntity.ok(adminService.getAccessStats(date, month, year));
    }
}
