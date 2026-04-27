package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.HealthConsultationResponse;
import com.penocean.ehs.model.HealthConsultation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HealthConsultationMapper {

    List<HealthConsultationResponse> findByUser(@Param("userId") Long userId);

    void insert(HealthConsultation consultation);

    void softDelete(@Param("id") Long id);
}
