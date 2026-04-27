package com.penocean.ehs.mapper;

import com.penocean.ehs.model.Port;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PortMapper {

    Port findById(@Param("id") Long id);

    List<Port> findAll();
}
