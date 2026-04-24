package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.response.ApprovalDetailResponse;
import com.penocean.ehs.dto.response.ApprovalListItemResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.ApprovalMapper;
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
public class ApprovalService {

    private final ApprovalMapper approvalMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<ApprovalListItemResponse> list(String status, String keyword,
                                                       String companyName, String businessNumber,
                                                       String dateFrom, String dateTo,
                                                       int page, int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        List<ApprovalListItemResponse> content = approvalMapper.findPending(
                status, keyword, companyName, businessNumber, dateFrom, dateTo, offset, s);
        long total = approvalMapper.countPending(status, keyword, companyName, businessNumber, dateFrom, dateTo);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public ApprovalDetailResponse detail(Long userId) {
        ApprovalDetailResponse detail = approvalMapper.findDetail(userId);
        if (detail == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        detail.setIndustries(userMapper.findIndustriesByUserId(userId));
        detail.setContractDepartments(approvalMapper.findDepartmentsByUserId(userId));
        return detail;
    }

    @Transactional
    public void approve(Long userId, Long approverUserId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        userMapper.approve(userId, approverUserId);

        notificationService.notifyRegistrationApproved(userId);
        log.info("User approved: userId={}, approverId={}", userId, approverUserId);
    }

    @Transactional
    public void reject(Long userId, String reason, Long approverUserId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        userMapper.reject(userId, approverUserId);

        notificationService.notifyRegistrationRejected(userId, reason);
        log.info("User rejected: userId={}, approverId={}, reason={}", userId, approverUserId, reason);
    }
}
