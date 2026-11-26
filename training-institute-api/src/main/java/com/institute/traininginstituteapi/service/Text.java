package com.institute.traininginstituteapi.service;

/** Small helpers for normalising user input. */
final class Text {

    private Text() {
    }

    /** Trims; returns null for null/blank input. */
    static String clean(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    /** Business codes are stored trimmed and upper-case (e.g. "jav-101" -> "JAV-101"). */
    static String code(String value) {
        String t = clean(value);
        return t == null ? null : t.toUpperCase();
    }

    static String email(String value) {
        String t = clean(value);
        return t == null ? null : t.toLowerCase();
    }
}
