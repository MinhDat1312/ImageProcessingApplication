package com.pipeline.image.service;

import com.pipeline.image.dto.request.admin.*;
import com.pipeline.image.dto.response.admin.*;
import com.pipeline.image.entity.*;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock UserRepository userRepository;
    @Mock ImageRepository imageRepository;
    @Mock RoleRepository roleRepository;
    @Mock PermissionRepository permissionRepository;
    @Mock LoginLogRepository loginLogRepository;

    @InjectMocks AdminService adminService;

    @Test
    void getAllUsers_returnsAllUsers() {
        Role role = new Role();
        role.setRoleId("r1");
        role.setName("USER");
        User user = new User();
        user.setUserId("u1");
        user.setUsername("testuser");
        user.setEmail("test@test.com");
        user.setEnabled(true);
        user.setRole(role);

        when(userRepository.findAllWithRole()).thenReturn(List.of(user));

        List<AdminUserResponse> result = adminService.getAllUsers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo("u1");
        assertThat(result.get(0).getRole().getName()).isEqualTo("USER");
    }

    @Test
    void deleteUser_whenNotFound_throwsInvalidException() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deleteUser("missing"))
                .isInstanceOf(InvalidException.class)
                .hasMessageContaining("Người dùng không tồn tại");
    }

    @Test
    void deleteUser_whenFound_deletesUser() throws InvalidException {
        User user = new User();
        user.setUserId("u1");
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        adminService.deleteUser("u1");

        verify(userRepository).delete(user);
    }

    @Test
    void createRole_savesAndReturns() {
        CreateRoleRequest req = new CreateRoleRequest();
        req.setName("EDITOR");
        req.setDescription("Editor role");
        Role saved = new Role();
        saved.setRoleId("r2");
        saved.setName("EDITOR");
        saved.setDescription("Editor role");
        saved.setActive(true);

        when(roleRepository.save(any())).thenReturn(saved);

        AdminRoleResponse result = adminService.createRole(req);

        assertThat(result.getName()).isEqualTo("EDITOR");
        assertThat(result.getRoleId()).isEqualTo("r2");
    }

    @Test
    void deletePermission_whenNotFound_throwsInvalidException() {
        when(permissionRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deletePermission("missing"))
                .isInstanceOf(InvalidException.class)
                .hasMessageContaining("Quyền hạn không tồn tại");
    }

    @Test
    void getAllImages_filenameExtractedFromUrl() {
        User user = new User();
        user.setUserId("u1");
        user.setUsername("testuser");
        user.setEmail("test@test.com");
        Image image = new Image();
        image.setImageId("img1");
        image.setUrl("http://example.com/storage/photo.jpg");
        image.setUser(user);

        when(imageRepository.findAllWithUser()).thenReturn(List.of(image));

        List<AdminImageResponse> result = adminService.getAllImages();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("img1");
        assertThat(result.get(0).getFilename()).isEqualTo("photo.jpg");
        assertThat(result.get(0).getOwner().getEmail()).isEqualTo("test@test.com");
    }
}
