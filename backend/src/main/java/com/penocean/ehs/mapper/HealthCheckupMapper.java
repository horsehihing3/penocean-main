package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.HealthCheckupDetailResponse;
import com.penocean.ehs.dto.response.HealthCheckupListItem;
import com.penocean.ehs.model.HealthCheckup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface HealthCheckupMapper {

    HealthCheckup findById(@Param("id") Long id);

    HealthCheckupDetailResponse findByIdWithDetail(@Param("id") Long id);

    List<HealthCheckupListItem> findPage(@Param("userId") Long userId,
                                         @Param("companyId") Long companyId,
                                         @Param("checkupType") String checkupType,
                                         @Param("dateFrom") LocalDate dateFrom,
                                         @Param("dateTo") LocalDate dateTo,
                                         @Param("offset") int offset,
                                         @Param("limit") int limit);

    long count(@Param("userId") Long userId,
               @Param("companyId") Long companyId,
               @Param("checkupType") String checkupType,
               @Param("dateFrom") LocalDate dateFrom,
               @Param("dateTo") LocalDate dateTo);

    void insert(HealthCheckup checkup);

    void softDelete(@Param("id") Long id);
}
