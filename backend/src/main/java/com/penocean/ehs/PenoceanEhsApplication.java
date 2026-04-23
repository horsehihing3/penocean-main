package com.penocean.ehs;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.penocean.ehs.mapper")
public class PenoceanEhsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PenoceanEhsApplication.class, args);
    }
}
