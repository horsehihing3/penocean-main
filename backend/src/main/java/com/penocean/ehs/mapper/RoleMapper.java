package com.penocean.ehs.mapper;

import com.penocean.ehs.model.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RoleMapper {

    List<Role> findAll();

    Role findByCode(@Param("code") String code);
}
