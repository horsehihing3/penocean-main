package com.penocean.ehs.mapper;

import com.penocean.ehs.model.HealthVital;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface HealthVitalMapper {

    List<HealthVital> findByCheckup(@Param("checkupId") Long checkupId);

    List<HealthVital> findByUserDateRange(@Param("userId") Long userId,
                                          @Param("dateFrom") LocalDate dateFrom,
                                          @Param("dateTo") LocalDate dateTo,
                                          @Param("hypertensionOnly") Boolean hypertensionOnly,
                                          @Param("diabetesOnly") Boolean diabetesOnly,
                                          @Param("dyslipidemiaOnly") Boolean dyslipidemiaOnly);

    long countByFlag(@Param("userId") Long userId,
                     @Param("dateFrom") LocalDate dateFrom,
                     @Param("dateTo") LocalDate dateTo,
                     @Param("flag") String flag);

    void insert(HealthVital vital);
}
