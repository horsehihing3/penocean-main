package com.penocean.ehs.service;

import com.penocean.ehs.dto.response.UserResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userMapper.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public void update(User user) {
        userMapper.update(user);
    }

    @Transactional
    public void delete(Long id) {
        userMapper.delete(id);
    }
}
