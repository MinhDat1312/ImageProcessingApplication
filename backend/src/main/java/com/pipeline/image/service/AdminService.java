package com.pipeline.image.service;

import com.pipeline.image.dto.request.admin.*;
import com.pipeline.image.dto.response.admin.*;
import com.pipeline.image.entity.*;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final LoginLogRepository loginLogRepository;

    // ── Users ────────────────────────────────────────────────────────────

    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAllWithRole().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserResponse updateUser(String userId, UpdateUserRequest req) throws InvalidException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidException("Người dùng không tồn tại"));
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getRoleId() != null) {
            Role role = roleRepository.findById(req.getRoleId())
                    .orElseThrow(() -> new InvalidException("Vai trò không tồn tại"));
            user.setRole(role);
        }
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void toggleUserStatus(String userId, boolean enabled) throws InvalidException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidException("Người dùng không tồn tại"));
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String userId) throws InvalidException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidException("Người dùng không tồn tại"));
        userRepository.delete(user);
    }

    // ── Images ───────────────────────────────────────────────────────────

    public List<AdminImageResponse> getAllImages() {
        return imageRepository.findAllWithUser().stream()
                .map(this::toImageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteImage(String imageId) throws InvalidException {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new InvalidException("Hình ảnh không tồn tại"));
        imageRepository.delete(image);
    }

    // ── Roles ────────────────────────────────────────────────────────────

    public List<AdminRoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toRoleResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminRoleResponse createRole(CreateRoleRequest req) {
        Role role = new Role();
        role.setName(req.getName());
        role.setDescription(req.getDescription());
        role.setActive(true);
        return toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    public AdminRoleResponse updateRole(String roleId, UpdateRoleRequest req) throws InvalidException {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new InvalidException("Vai trò không tồn tại"));
        if (req.getName() != null) role.setName(req.getName());
        if (req.getDescription() != null) role.setDescription(req.getDescription());
        if (req.getActive() != null) role.setActive(req.getActive());
        return toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(String roleId) throws InvalidException {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new InvalidException("Vai trò không tồn tại"));
        roleRepository.delete(role);
    }

    // ── Permissions ──────────────────────────────────────────────────────

    public List<AdminPermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::toPermissionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminPermissionResponse createPermission(CreatePermissionRequest req) {
        Permission perm = Permission.builder()
                .name(req.getName())
                .apiPath(req.getApiPath())
                .method(req.getMethod())
                .module(req.getModule())
                .build();
        return toPermissionResponse(permissionRepository.save(perm));
    }

    @Transactional
    public AdminPermissionResponse updatePermission(String permissionId, UpdatePermissionRequest req)
            throws InvalidException {
        Permission perm = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new InvalidException("Quyền hạn không tồn tại"));
        if (req.getName() != null) perm.setName(req.getName());
        if (req.getApiPath() != null) perm.setApiPath(req.getApiPath());
        if (req.getMethod() != null) perm.setMethod(req.getMethod());
        if (req.getModule() != null) perm.setModule(req.getModule());
        return toPermissionResponse(permissionRepository.save(perm));
    }

    @Transactional
    public void deletePermission(String permissionId) throws InvalidException {
        Permission perm = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new InvalidException("Quyền hạn không tồn tại"));
        permissionRepository.delete(perm);
    }

    // ── Access Stats ─────────────────────────────────────────────────────

    public AccessStatsResponse getAccessStats(String date, String month, Integer year) throws InvalidException {
        if (date != null && !date.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new InvalidException("date phải có định dạng YYYY-MM-DD");
        }
        if (month != null && !month.matches("\\d{4}-\\d{2}")) {
            throw new InvalidException("month phải có định dạng YYYY-MM");
        }
        AccessStatsResponse response = new AccessStatsResponse();
        response.setTotalAccess(loginLogRepository.count());
        response.setTodayAccess(loginLogRepository.countToday());

        if (date != null) {
            List<AccessStatsResponse.AccessLog> hourly = loginLogRepository
                    .findHourlyStatsByDate(date).stream()
                    .map(row -> new AccessStatsResponse.AccessLog(
                            String.format("%02d:00", ((Number) row[0]).intValue()),
                            ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            response.setHourly(hourly);
        }

        if (month != null) {
            List<AccessStatsResponse.AccessLog> daily = loginLogRepository
                    .findDailyStatsByMonth(month).stream()
                    .map(row -> new AccessStatsResponse.AccessLog(
                            month + "-" + String.format("%02d", ((Number) row[0]).intValue()),
                            ((Number) row[1]).longValue()))
                    .collect(Collectors.toList());
            response.setDaily(daily);
        }

        int resolvedYear = year != null ? year : Year.now().getValue();
        List<AccessStatsResponse.AccessLog> monthly = loginLogRepository
                .findMonthlyStatsByYear(resolvedYear).stream()
                .map(row -> new AccessStatsResponse.AccessLog(
                        resolvedYear + "-" + String.format("%02d", ((Number) row[0]).intValue()),
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
        response.setMonthly(monthly);

        return response;
    }

    // ── Mappers ──────────────────────────────────────────────────────────

    private AdminUserResponse toUserResponse(User user) {
        AdminUserResponse res = new AdminUserResponse();
        res.setUserId(user.getUserId());
        res.setUsername(user.getUsername());
        res.setEmail(user.getEmail());
        res.setGender(user.getGender());
        res.setAvatar(user.getAvatar());
        res.setEnabled(user.isEnabled());
        res.setCreatedAt(user.getCreatedAt());
        res.setUpdatedAt(user.getUpdatedAt());
        if (user.getRole() != null) {
            res.setRole(new AdminUserResponse.RoleInfo(
                    user.getRole().getRoleId(), user.getRole().getName()));
        }
        return res;
    }

    private AdminImageResponse toImageResponse(Image image) {
        AdminImageResponse res = new AdminImageResponse();
        res.setId(image.getImageId());
        res.setUrl(image.getUrl());
        res.setCreatedAt(image.getCreatedAt());
        String url = image.getUrl();
        if (url != null) {
            int lastSlash = url.lastIndexOf('/');
            res.setFilename(lastSlash >= 0 ? url.substring(lastSlash + 1) : url);
        }
        if (image.getUser() != null) {
            User u = image.getUser();
            res.setOwner(new AdminImageResponse.OwnerInfo(u.getUserId(), u.getUsername(), u.getEmail()));
        }
        return res;
    }

    private AdminRoleResponse toRoleResponse(Role role) {
        AdminRoleResponse res = new AdminRoleResponse();
        res.setRoleId(role.getRoleId());
        res.setName(role.getName());
        res.setDescription(role.getDescription());
        res.setActive(role.isActive());
        return res;
    }

    private AdminPermissionResponse toPermissionResponse(Permission perm) {
        AdminPermissionResponse res = new AdminPermissionResponse();
        res.setPermissionId(perm.getPermissionId());
        res.setName(perm.getName());
        res.setApiPath(perm.getApiPath());
        res.setMethod(perm.getMethod());
        res.setModule(perm.getModule());
        return res;
    }
}
