package com.penocean.ehs.mapper;

import com.penocean.ehs.model.VoiceAttachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VoiceAttachmentMapper {

    List<VoiceAttachment> findByVoice(@Param("voiceId") Long voiceId);

    VoiceAttachment findById(@Param("id") Long id);

    void insert(VoiceAttachment attachment);

    void softDelete(@Param("id") Long id);
}
