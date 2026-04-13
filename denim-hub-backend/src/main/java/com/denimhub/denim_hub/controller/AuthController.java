package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.DTO.ChangePasswordRequest;
import com.denimhub.denim_hub.DTO.LoginRequest;
import com.denimhub.denim_hub.DTO.LoginResponse;
import com.denimhub.denim_hub.entity.Users;
import com.denimhub.denim_hub.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        boolean success = userService.login(request.getUsername(), request.getPassword());
        if (success) {
            Users user = userService.findByUsername(request.getUsername());
            return new LoginResponse("Login successful", user.getRole());
        } else {
            return new LoginResponse("Invalid credentials", null);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(request.getUsername(), request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok("Password changed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}