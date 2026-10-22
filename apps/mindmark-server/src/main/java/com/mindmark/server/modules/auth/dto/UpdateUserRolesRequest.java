package com.mindmark.server.modules.auth.dto;

import com.mindmark.server.modules.auth.domain.RoleCode;
import java.util.Set;

public record UpdateUserRolesRequest(Set<RoleCode> roles) {
}