package com.powergrid.maintenance.tms_backend_application.inspection.util;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.ElementType;

import org.hibernate.annotations.IdGeneratorType;

@IdGeneratorType(CustomIdGenerator.class)
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
public @interface NineDigitId { }
