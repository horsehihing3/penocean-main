package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.SafetyPerformanceLandResponse;
import com.penocean.ehs.model.SafetyPerformanceLand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyPerformanceLandMapper {

    SafetyPerformanceLand findById(@Param("id") Long id);

    SafetyPerformanceLand findByKey(@Param("departmentId") Long departmentId,
                                    @Param("periodYear") Integer periodYear,
                                    @Param("periodMonth") Integer periodMonth);

    List<SafetyPerformanceLandResponse> findPage(@Param("departmentId") Long departmentId,
                                                 @Param("year") Integer year,
                                                 @Param("month") Integer month,
                                                 @Param("offset") int offset,
                                                 @Param("limit") int limit);

    long count(@Param("departmentId") Long departmentId,
               @Param("year") Integer year,
               @Param("month") Integer month);

    void insert(SafetyPerformanceLand record);

    void update(SafetyPerformanceLand record);

    void softDelete(@Param("id") Long id);
}
