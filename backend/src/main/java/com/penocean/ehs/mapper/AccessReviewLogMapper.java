package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.AccessRequestDetailResponse;
import com.penocean.ehs.model.AccessReviewLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccessReviewLogMapper {

    List<AccessRequestDetailResponse.ReviewLogItem> findByRequest(@Param("accessRequestId") Long accessRequestId);

    void insert(AccessReviewLog log);
}
