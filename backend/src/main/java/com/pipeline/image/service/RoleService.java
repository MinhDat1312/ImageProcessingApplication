package com.pipeline.image.service;

import com.pipeline.image.entity.Role;
import com.pipeline.image.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    public Role handleGetRoleByName(String name) {
        return this.roleRepository.findByName(name);
    }
}
