package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.AccessRequestDetailResponse;
import com.penocean.ehs.dto.response.AccessRequestListItem;
import com.penocean.ehs.model.AccessRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AccessRequestMapper {

    AccessRequest findById(@Param("id") Long id);

    AccessRequestDetailResponse findByIdWithDetails(@Param("id") Long id);

    List<AccessRequestListItem> findPage(@Param("status") String status,
                                         @Param("companyId") Long companyId,
                                         @Param("vesselId") Long vesselId,
                                         @Param("keyword") String keyword,
                                         @Param("dateFrom") LocalDate dateFrom,
                                         @Param("dateTo") LocalDate dateTo,
                                         @Param("offset") int offset,
                                         @Param("limit") int limit);

    long count(@Param("status") String status,
               @Param("companyId") Long companyId,
               @Param("vesselId") Long vesselId,
               @Param("keyword") String keyword,
               @Param("dateFrom") LocalDate dateFrom,
               @Param("dateTo") LocalDate dateTo);

    void insert(AccessRequest request);

    void updateCore(AccessRequest request);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void updateSubmit(@Param("id") Long id, @Param("submittedBy") Long submittedBy);

    void updateReviewer(@Param("id") Long id,
                        @Param("status") String status,
                        @Param("reviewedBy") Long reviewedBy);

    void updateImprovementReason(@Param("id") Long id,
                                 @Param("reason") String reason,
                                 @Param("reviewedBy") Long reviewedBy);

    void updateWorkerCount(@Param("id") Long id, @Param("count") int count);

    void softDelete(@Param("id") Long id);

    /**
     * Returns max sequence number for request_no on the given dateYmd (yyyyMMdd).
     * Caller formats AR-YYYYMMDD-NNNN with max+1.
     */
    Integer findMaxRequestNoSeq(@Param("dateYmd") String dateYmd);
}
