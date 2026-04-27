package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.FormTemplateResponse;
import com.penocean.ehs.model.FormTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FormTemplateMapper {

    FormTemplate findById(@Param("id") Long id);

    FormTemplateResponse findByIdWithDetail(@Param("id") Long id);

    List<FormTemplateResponse> findPage(@Param("category") String category,
                                        @Param("keyword") String keyword,
                                        @Param("activeOnly") Boolean activeOnly,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    long count(@Param("category") String category,
               @Param("keyword") String keyword,
               @Param("activeOnly") Boolean activeOnly);

    void insert(FormTemplate form);

    void incrementDownloadCount(@Param("id") Long id);

    void softDelete(@Param("id") Long id);

    int existsByCode(@Param("code") String code);
}
