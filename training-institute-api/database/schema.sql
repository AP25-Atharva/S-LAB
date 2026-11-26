-- =====================================================================
-- Training Institute Course and Batch Management System - MySQL schema
-- Engine: InnoDB, charset utf8mb4. Run once:  mysql -u root -p < schema.sql
-- =====================================================================
CREATE DATABASE IF NOT EXISTS training_institute
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE training_institute;

-- One course can be offered in many batches
CREATE TABLE IF NOT EXISTS course (
  course_id       BIGINT        NOT NULL AUTO_INCREMENT,
  course_code     VARCHAR(20)   NOT NULL,
  title           VARCHAR(150)  NOT NULL,
  category        VARCHAR(80)   NOT NULL,
  duration_hours  INT           NOT NULL,
  fee             DECIMAL(10,2) NOT NULL,
  description     TEXT,
  active          TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (course_id),
  UNIQUE KEY course_code (course_code),
  CONSTRAINT course_chk_1 CHECK (duration_hours > 0),
  CONSTRAINT course_chk_2 CHECK (fee >= 0)
) ENGINE=InnoDB;

-- One trainer can conduct many batches
CREATE TABLE IF NOT EXISTS trainer (
  trainer_id    BIGINT       NOT NULL AUTO_INCREMENT,
  trainer_code  VARCHAR(20)  NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL,
  phone         VARCHAR(15)  NOT NULL,
  expertise     VARCHAR(150),
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (trainer_id),
  UNIQUE KEY trainer_code (trainer_code),
  UNIQUE KEY email (email)
) ENGINE=InnoDB;

-- One student can enrol in many batches
CREATE TABLE IF NOT EXISTS student (
  student_id         BIGINT       NOT NULL AUTO_INCREMENT,
  student_code       VARCHAR(20)  NOT NULL,
  full_name          VARCHAR(100) NOT NULL,
  email              VARCHAR(120) NOT NULL,
  phone              VARCHAR(15)  NOT NULL,
  qualification      VARCHAR(100),
  registration_date  DATE         NOT NULL,
  status             ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (student_id),
  UNIQUE KEY student_code (student_code),
  UNIQUE KEY email (email)
) ENGINE=InnoDB;

-- Each batch is for exactly one course and one assigned trainer
CREATE TABLE IF NOT EXISTS batch (
  batch_id    BIGINT      NOT NULL AUTO_INCREMENT,
  batch_code  VARCHAR(20) NOT NULL,
  course_id   BIGINT      NOT NULL,
  trainer_id  BIGINT      NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  mode        ENUM('CLASSROOM','ONLINE','HYBRID') NOT NULL,
  capacity    INT         NOT NULL,
  status      ENUM('PLANNED','RUNNING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  PRIMARY KEY (batch_id),
  UNIQUE KEY batch_code (batch_code),
  KEY course_id (course_id),
  KEY trainer_id (trainer_id),
  CONSTRAINT batch_ibfk_1 FOREIGN KEY (course_id)  REFERENCES course (course_id),
  CONSTRAINT batch_ibfk_2 FOREIGN KEY (trainer_id) REFERENCES trainer (trainer_id),
  CONSTRAINT batch_chk_1 CHECK (capacity > 0),
  CONSTRAINT batch_chk_2 CHECK (end_date >= start_date)
) ENGINE=InnoDB;

-- Links a student to a batch. "No duplicate ACTIVE enrolment" is enforced in the
-- service layer (a student may re-enrol after withdrawing, so no plain unique key).
CREATE TABLE IF NOT EXISTS enrolment (
  enrolment_id           BIGINT       NOT NULL AUTO_INCREMENT,
  student_id             BIGINT       NOT NULL,
  batch_id               BIGINT       NOT NULL,
  enrolment_date         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status                 ENUM('ENROLLED','WAITLISTED','COMPLETED','WITHDRAWN') NOT NULL DEFAULT 'ENROLLED',
  attendance_percentage  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  remarks                VARCHAR(255),
  PRIMARY KEY (enrolment_id),
  KEY student_id (student_id),
  KEY batch_id (batch_id),
  CONSTRAINT enrolment_ibfk_1 FOREIGN KEY (student_id) REFERENCES student (student_id),
  CONSTRAINT enrolment_ibfk_2 FOREIGN KEY (batch_id)   REFERENCES batch (batch_id),
  CONSTRAINT enrolment_chk_1 CHECK (attendance_percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB;
