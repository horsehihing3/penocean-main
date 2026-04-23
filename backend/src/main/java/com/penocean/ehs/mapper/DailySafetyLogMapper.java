package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.DailySafetyLogResponse;
import com.penocean.ehs.model.DailySafetyLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface DailySafetyLogMapper {

    DailySafetyLogResponse findById(@Param("id") Long id);

    List<DailySafetyLogResponse> findPage(@Param("vesselId") Long vesselId,
                                          @Param("companyId") Long companyId,
                                          @Param("dateFrom") LocalDate dateFrom,
                                          @Param("dateTo") LocalDate dateTo,
                                          @Param("offset") int offset,
                                          @Param("limit") int limit);

    long count(@Param("vesselId") Long vesselId,
               @Param("companyId") Long companyId,
               @Param("dateFrom") LocalDate dateFrom,
               @Param("dateTo") LocalDate dateTo);

    void insert(DailySafetyLog log);

    void softDelete(@Param("id") Long id);
}
