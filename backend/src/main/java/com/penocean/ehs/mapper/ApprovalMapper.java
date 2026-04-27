package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.ApprovalDetailResponse;
import com.penocean.ehs.dto.response.ApprovalListItemResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ApprovalMapper {

    List<ApprovalListItemResponse> findPending(@Param("status") String status,
                                               @Param("keyword") String keyword,
                                               @Param("companyName") String companyName,
                                               @Param("businessNumber") String businessNumber,
                                               @Param("dateFrom") String dateFrom,
                                               @Param("dateTo") String dateTo,
                                               @Param("offset") int offset,
                                               @Param("limit") int limit);

    long countPending(@Param("status") String status,
                      @Param("keyword") String keyword,
                      @Param("companyName") String companyName,
                      @Param("businessNumber") String businessNumber,
                      @Param("dateFrom") String dateFrom,
                      @Param("dateTo") String dateTo);

    ApprovalDetailResponse findDetail(@Param("userId") Long userId);

    List<ApprovalDetailResponse.DepartmentRef> findDepartmentsByUserId(@Param("userId") Long userId);
}
