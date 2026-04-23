package com.penocean.ehs.mapper;

import com.penocean.ehs.model.AccessAttachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccessAttachmentMapper {

    List<AccessAttachment> findByRequest(@Param("accessRequestId") Long accessRequestId);

    AccessAttachment findById(@Param("id") Long id);

    void insert(AccessAttachment attachment);

    void softDelete(@Param("id") Long id);
}
