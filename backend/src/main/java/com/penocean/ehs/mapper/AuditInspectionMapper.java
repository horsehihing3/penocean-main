package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.AuditInspectionDetailResponse;
import com.penocean.ehs.dto.response.AuditInspectionListItem;
import com.penocean.ehs.model.AuditInspection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AuditInspectionMapper {

    AuditInspection findById(@Param("id") Long id);

    AuditInspectionDetailResponse findByIdWithDetail(@Param("id") Long id);

    List<AuditInspectionListItem> findPage(@Param("inspectionType") String inspectionType,
                                           @Param("status") String status,
                                           @Param("dateFrom") LocalDate dateFrom,
                                           @Param("dateTo") LocalDate dateTo,
                                           @Param("offset") int offset,
                                           @Param("limit") int limit);

    long count(@Param("inspectionType") String inspectionType,
               @Param("status") String status,
               @Param("dateFrom") LocalDate dateFrom,
               @Param("dateTo") LocalDate dateTo);

    void insert(AuditInspection inspection);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void softDelete(@Param("id") Long id);
}
