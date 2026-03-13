package app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import app.entity.User;
import app.repository.UserRepository;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // POST /auth/register
    @PostMapping("/register")
    public String register(@RequestBody User user) {
        // check if email already exists
        User existing = userRepository.findByEmail(user.getEmail());
        if (existing != null) {
            return "Email already exists";
        }

        userRepository.save(user);
        return "Registration successful";
    }

    // POST /auth/login
    @PostMapping("/login")
    public String login(@RequestBody User loginRequest) {
        User dbUser = userRepository.findByEmail(loginRequest.getEmail());
        if (dbUser == null) {
            return "User not found";
        }

        if (!dbUser.getPassword().equals(loginRequest.getPassword())) {
            return "Invalid password";
        }

        // later we can return token / user info; for now just text
        return "Login successful";
    }
}
