package com.pipeline.image.config;

import com.pipeline.image.entity.User;
import com.pipeline.image.entity.Role;
import com.pipeline.image.repository.RoleRepository;
import com.pipeline.image.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRole(com.pipeline.image.common.Role.ADMIN, "Default administrator role");
        seedRole(com.pipeline.image.common.Role.USER, "Default user role");
        seedAdminUser();
    }

    private void seedRole(com.pipeline.image.common.Role roleEnum, String description) {
        Role role = this.roleRepository.findByName(roleEnum.getValue());
        if (role != null) {
            return;
        }

        Role newRole = new Role();
        newRole.setName(roleEnum.getValue());
        newRole.setDescription(description);
        newRole.setActive(true);
        this.roleRepository.save(newRole);

        log.info("Seeded default role: {}", roleEnum.getValue());
    }

    private void seedAdminUser() {
        String adminEmail = "admin@gmail.com";
        User admin = this.userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);
        Role adminRole = this.roleRepository.findByName(com.pipeline.image.common.Role.ADMIN.getValue());

        if (admin == null) {
            User newAdmin = new User();
            newAdmin.setUsername("admin");
            newAdmin.setEmail(adminEmail);
            newAdmin.setPassword(this.passwordEncoder.encode("12345678"));
            newAdmin.setEnabled(true);
            newAdmin.setRole(adminRole);
            this.userRepository.save(newAdmin);

            log.info("Seeded default admin user: {}", adminEmail);
            return;
        }

        boolean changed = false;
        if (adminRole != null && (admin.getRole() == null || !adminRole.getRoleId().equals(admin.getRole().getRoleId()))) {
            admin.setRole(adminRole);
            changed = true;
        }
        if (!admin.isEnabled()) {
            admin.setEnabled(true);
            changed = true;
        }

        if (changed) {
            this.userRepository.save(admin);
            log.info("Updated default admin user: {}", adminEmail);
        }
    }
}

