package com.allicatest.mvc.exception;

public class CustomerAlreadyExistsException extends RuntimeException {
    public CustomerAlreadyExistsException(String first, String last) {
        super("Customer " + first + " " + last + " with this date of birth already exists");
    }
}
