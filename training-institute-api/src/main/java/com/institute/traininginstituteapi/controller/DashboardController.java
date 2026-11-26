package com.institute.traininginstituteapi.controller;

import com.institute.traininginstituteapi.dto.DashboardResponse;
import com.institute.traininginstituteapi.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardResponse get() {
        return dashboardService.getDashboard();
    }
}
