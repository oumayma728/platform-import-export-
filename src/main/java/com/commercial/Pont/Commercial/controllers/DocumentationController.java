package com.commercial.Pont.Commercial.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DocumentationController {

    @GetMapping("/redoc")
    public String redoc() {

        return "redirect:/redoc.html";
    }
}