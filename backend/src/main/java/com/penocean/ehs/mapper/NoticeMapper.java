package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.NoticeDetailResponse;
import com.penocean.ehs.dto.response.NoticeListItem;
import com.penocean.ehs.model.Notice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NoticeMapper {

    Notice findById(@Param("id") Long id);

    NoticeDetailResponse findByIdWithDetail(@Param("id") Long id);

    List<NoticeListItem> findPage(@Param("category") String category,
                                  @Param("keyword") String keyword,
                                  @Param("role") String role,
                                  @Param("offset") int offset,
                                  @Param("limit") int limit);

    long count(@Param("category") String category,
               @Param("keyword") String keyword,
               @Param("role") String role);

    void insert(Notice notice);

    void update(Notice notice);

    void incrementViewCount(@Param("id") Long id);

    void updatePinned(@Param("id") Long id, @Param("pinned") boolean pinned);

    void softDelete(@Param("id") Long id);
}
