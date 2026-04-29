package com.penocean.ehs.service;

import com.penocean.ehs.dto.request.LoginRequest;
import com.penocean.ehs.dto.request.RegisterRequest;
import com.penocean.ehs.dto.response.LoginResponse;
import com.penocean.ehs.dto.response.UserResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.CompanyMapper;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Company;
import com.penocean.ehs.model.User;
import com.penocean.ehs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final CompanyMapper companyMapper;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        // 가입 상태 검증
        String status = user.getStatus();
        if ("PENDING".equalsIgnoreCase(status)) {
            throw new BadRequestException("가입 승인 대기중입니다");
        }
        if ("REJECTED".equalsIgnoreCase(status)) {
            throw new BadRequestException("가입 신청이 반려되었습니다");
        }
        if ("INACTIVE".equalsIgnoreCase(status)) {
            throw new BadRequestException("비활성 계정입니다");
        }
        if (!"APPROVED".equalsIgnoreCase(status) && !"ACTIVE".equalsIgnoreCase(status)) {
            throw new BadRequestException("로그인할 수 없는 계정 상태입니다");
        }

        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(request.getUsername());

        userMapper.updateLastLoginAt(user.getId());

        log.info("User logged in: {}", user.getUsername());

        return LoginResponse.of(
                accessToken,
                refreshToken,
                tokenProvider.getExpirationTime(),
                UserResponse.from(user)
        );
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }

        String newAccessToken = tokenProvider.generateToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        return LoginResponse.of(
                newAccessToken,
                newRefreshToken,
                tokenProvider.getExpirationTime(),
                UserResponse.from(user)
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return UserResponse.from(user);
    }

    /**
     * 협력업체 가입 신청.
     * - email 을 username 으로 사용
     * - tb_company 는 business_number 로 upsert
     * - tb_user_industry / tb_user_department INSERT
     * - 상태 PENDING 으로 생성
     * - ADMIN 전원에게 알림
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        // PPT slide 6: 아이디(username) 을 별도 필드로 받되, 공란이면 email 을 사용
        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim()
                : request.getEmail();

        if (userMapper.existsByUsername(username) == 1) {
            throw new BadRequestException("이미 사용 중인 아이디입니다");
        }

        // 1. Company upsert
        Company company = companyMapper.findByBusinessNumber(request.getBusinessNumber());
        Long companyId;
        if (company != null) {
            companyId = company.getId();
        } else {
            String primaryIndustry = request.getIndustryCodes().isEmpty()
                    ? null
                    : request.getIndustryCodes().get(0);
            Company newCompany = Company.builder()
                    .businessNumber(request.getBusinessNumber())
                    .name(request.getCompanyName())
                    .nameEn(request.getCompanyNameEn())
                    .ceoName(request.getContactName())
                    .postalCode(request.getPostalCode())
                    .address(request.getAddress())
                    .addressDetail(request.getAddressDetail())
                    .phone(request.getCompanyPhone() != null
                            ? request.getCompanyPhone() : request.getPhone())
                    .email(request.getEmail())
                    .industryCode(primaryIndustry)
                    .industryOther(request.getIndustryOther())
                    .businessLicenseFilePath(request.getBusinessLicenseFilePath())
                    .status("ACTIVE")
                    .contractStartDate(LocalDate.now())
                    .contractEndDate(LocalDate.now().plusYears(2))
                    .build();
            companyMapper.insert(newCompany);
            companyId = newCompany.getId();
        }

        // 2. User insert (PENDING) — 안전담당자 정보
        User newUser = User.builder()
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getContactName())
                .title(request.getContactTitle())
                .email(request.getEmail())
                .phone(request.getPhone())
                .roleCode("CONTRACTOR")
                .companyId(companyId)
                .status("PENDING")
                .build();
        userMapper.insert(newUser);
        Long userId = newUser.getId();

        // 3. industries
        if (request.getIndustryCodes() != null) {
            for (String code : request.getIndustryCodes()) {
                if (code == null || code.isBlank()) continue;
                userMapper.insertUserIndustry(userId, code);
            }
        }

        // 4. departments (code -> id 변환, 없는 code 는 무시)
        if (request.getContractDepartments() != null) {
            for (String deptCode : request.getContractDepartments()) {
                if (deptCode == null || deptCode.isBlank()) continue;
                Long deptId = userMapper.findDepartmentIdByCode(deptCode);
                if (deptId != null) {
                    userMapper.insertUserDepartment(userId, deptId);
                }
            }
        }

        // 5. ADMIN 전원에게 가입 승인 요청 알림 (PPT 템플릿)
        notificationService.notifyRegistrationRequestToAdmins(
                request.getCompanyName(), request.getBusinessNumber());

        log.info("Registration submitted: username={}, companyId={}", username, companyId);

        return UserResponse.from(newUser);
    }

    // [2026-04-30] 아이디 중복확인
    public boolean isUsernameAvailable(String username) {
        return userMapper.existsByUsername(username) == 0;
    }

    // [2026-04-30] 사업자번호 중복확인
    public boolean isBusinessNumberAvailable(String businessNumber) {
        return companyMapper.findByBusinessNumber(businessNumber) == null;
    }
}
