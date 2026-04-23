package com.penocean.ehs.mapper;

import com.penocean.ehs.model.SafetyRule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyRuleMapper {

    SafetyRule findById(@Param("id") Long id);

    List<SafetyRule> findAll(@Param("industryCode") String industryCode,
                             @Param("activeOnly") Boolean activeOnly);

    void insert(SafetyRule rule);

    void update(SafetyRule rule);

    void updateSortOrder(@Param("id") Long id, @Param("sortOrder") Integer sortOrder);

    void softDelete(@Param("id") Long id);
}
