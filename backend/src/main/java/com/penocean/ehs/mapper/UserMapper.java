package com.penocean.ehs.mapper;

import com.penocean.ehs.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {

    User findById(@Param("id") Long id);

    User findByUsername(@Param("username") String username);

    User findByEmail(@Param("email") String email);

    List<User> findAll();

    int existsByUsername(@Param("username") String username);

    void insert(User user);

    void update(User user);

    void delete(@Param("id") Long id);

    void updateLastLoginAt(@Param("id") Long id);

    void approve(@Param("id") Long id, @Param("approverId") Long approverId);

    void reject(@Param("id") Long id, @Param("approverId") Long approverId);

    List<User> findByRole(@Param("roleCode") String roleCode);

    long countByStatus(@Param("status") String status);

    /** PPT slide 8 - 2-day reminder: PENDING 상태에서 createdAt이 hours 시간 이전인 유저들 */
    List<User> findPendingOlderThanHours(@Param("hours") int hours);

    // industry / department M:N
    void insertUserIndustry(@Param("userId") Long userId, @Param("industryCode") String industryCode);

    void deleteUserIndustries(@Param("userId") Long userId);

    List<String> findIndustriesByUserId(@Param("userId") Long userId);

    void insertUserDepartment(@Param("userId") Long userId, @Param("departmentId") Long departmentId);

    void deleteUserDepartments(@Param("userId") Long userId);

    Long findDepartmentIdByCode(@Param("code") String code);
}
