package com.powergrid.maintenance.tms_backend_application.common.exception;

public class ConflictException extends RuntimeException {
  public ConflictException(String msg) { super(msg); }
}