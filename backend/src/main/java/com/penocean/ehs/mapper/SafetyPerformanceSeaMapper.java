package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.SafetyPerformanceSeaResponse;
import com.penocean.ehs.dto.response.SeaYearlyStatsResponse;
import com.penocean.ehs.model.SafetyPerformanceSea;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyPerformanceSeaMapper {

    SafetyPerformanceSea findById(@Param("id") Long id);

    SafetyPerformanceSea findByKey(@Param("vesselId") Long vesselId,
                                   @Param("periodYear") Integer periodYear,
                                   @Param("periodMonth") Integer periodMonth);

    List<SafetyPerformanceSeaResponse> findPage(@Param("vesselId") Long vesselId,
                                                @Param("year") Integer year,
                                                @Param("month") Integer month,
                                                @Param("offset") int offset,
                                                @Param("limit") int limit);

    long count(@Param("vesselId") Long vesselId,
               @Param("year") Integer year,
               @Param("month") Integer month);

    void insert(SafetyPerformanceSea record);

    void update(SafetyPerformanceSea record);

    void bulkInsertFromExcel(@Param("list") List<SafetyPerformanceSea> list);

    void softDelete(@Param("id") Long id);

    // [2026-04-30] 연도별 집계 통계
    List<SeaYearlyStatsResponse> yearlyStats(@Param("fromYear") int fromYear);
}
