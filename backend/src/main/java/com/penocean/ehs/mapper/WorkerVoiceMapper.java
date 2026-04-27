package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.WorkerVoiceDetailResponse;
import com.penocean.ehs.dto.response.WorkerVoiceListItem;
import com.penocean.ehs.model.WorkerVoice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface WorkerVoiceMapper {

    WorkerVoice findById(@Param("id") Long id);

    WorkerVoiceDetailResponse findByIdWithDetail(@Param("id") Long id);

    List<WorkerVoiceListItem> findPage(@Param("voiceType") String voiceType,
                                       @Param("status") String status,
                                       @Param("companyId") Long companyId,
                                       @Param("vesselId") Long vesselId,
                                       @Param("keyword") String keyword,
                                       @Param("dateFrom") LocalDate dateFrom,
                                       @Param("dateTo") LocalDate dateTo,
                                       @Param("excludeAnonymous") Boolean excludeAnonymous,
                                       @Param("offset") int offset,
                                       @Param("limit") int limit);

    long count(@Param("voiceType") String voiceType,
               @Param("status") String status,
               @Param("companyId") Long companyId,
               @Param("vesselId") Long vesselId,
               @Param("keyword") String keyword,
               @Param("dateFrom") LocalDate dateFrom,
               @Param("dateTo") LocalDate dateTo,
               @Param("excludeAnonymous") Boolean excludeAnonymous);

    void insert(WorkerVoice voice);

    void updateStatus(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("assignedTo") Long assignedTo,
                      @Param("resolution") String resolution);

    void softDelete(@Param("id") Long id);

    Integer findMaxSeqByDate(@Param("dateStr") String dateStr);
}
