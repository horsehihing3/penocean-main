package com.penocean.ehs.mapper;

import com.penocean.ehs.model.EvaluationItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EvaluationItemMapper {

    List<EvaluationItem> findAll(@Param("activeOnly") boolean activeOnly);

    EvaluationItem findById(@Param("id") Long id);

    EvaluationItem findByCode(@Param("code") String code);

    List<EvaluationItem> findByIds(@Param("ids") List<Long> ids);

    void insert(EvaluationItem item);

    void update(EvaluationItem item);

    void softDelete(@Param("id") Long id);

    void updateSortOrder(@Param("id") Long id, @Param("sortOrder") Integer sortOrder);
}
