# Course Provisioning Platform -- Technical Specification (NestJS Version)

## Overview

Build a production-ready web application using NestJS that provisions:

1.  A new Discord server per course/semester
2.  GitHub repositories (single or per lab group)
3.  Roles, channels, permissions, and invites
4.  Repository protections and seeded course requirements
5.  Deterministic, idempotent provisioning workflows
6.  Full audit logging
7.  Async retry-safe execution

This system must demonstrate production-grade architecture and
senior-level design decisions.

------------------------------------------------------------------------

# Architecture

## Backend Framework

-   NestJS (TypeScript)
-   Modular architecture
-   Dependency Injection
-   DTO validation
-   OpenAPI (Swagger)

## Database

-   PostgreSQL
-   Prisma or TypeORM
-   Migration-based schema

## Background Processing

-   BullMQ (Redis-backed)
-   Deterministic provisioning state machine

## Frontend

-   React
-   Minimal dashboard (create course + view status)

------------------------------------------------------------------------

# Course Types

## Lecture

-   One cohort
-   One Discord server
-   One GitHub repository
-   All students share access

## Laboratory

-   Multiple lab groups
-   Dedicated Discord role per group
-   Dedicated private channel per group
-   One GitHub repository per group (MVP requirement)

------------------------------------------------------------------------

# API Endpoints

## Create Course

POST /courses

## Get Course

GET /courses/:id

## Get Provisioning Status

GET /courses/:id/status

## Retry Provisioning

POST /courses/:id/retry

------------------------------------------------------------------------

# Provisioning Requirements

-   All provisioning must be idempotent
-   Each step must be retry-safe
-   External resource IDs must be persisted
-   All external API calls must be audit logged
-   Must support dev / staging / production environments

------------------------------------------------------------------------

# GitHub Requirements

-   Private repository
-   Branch protection enabled
-   Require pull request
-   Require at least 1 approval
-   Disable force push
-   Seed content:
    -   README.md
    -   syllabus.md
    -   CONTRIBUTING.md
    -   PR template
    -   Assignment template

------------------------------------------------------------------------

# Discord Requirements

Lecture: - #announcements - #general - #lectures - #qa-help

Laboratory: - Private channel per lab group - Dedicated group role -
Proper permission isolation

------------------------------------------------------------------------

# Definition of Done

Lecture: - Discord server created - GitHub repository created - Students
invited - Branch protection applied - Seed content pushed - Audit logs
stored

Laboratory: - Discord server created - Group roles created - Private
channels created - Repository per group created - Students invited
correctly - Branch protection applied - Seed content pushed - Audit logs
stored

System must be deterministic, modular, retry-safe, and production-ready.
