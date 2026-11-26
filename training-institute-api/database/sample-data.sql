-- =====================================================================
-- Sample data. WARNING: clears all existing rows first.
-- Run after schema.sql:  mysql -u root -p training_institute < sample-data.sql
-- Covers: a FULL batch (JAV-NOV26), a waitlist, a withdrawal, a cancelled batch,
-- a completed batch, an upcoming batch and a delayed batch (PLANNED, start date passed).
-- =====================================================================
USE training_institute;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE enrolment;
TRUNCATE TABLE batch;
TRUNCATE TABLE student;
TRUNCATE TABLE trainer;
TRUNCATE TABLE course;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO course (course_id, course_code, title, category, duration_hours, fee, description, active) VALUES
 (1, 'JAV-101', 'Java Full Stack Development', 'Programming', 120, 25000.00, 'Core Java, Spring Boot, REST APIs and Angular', 1),
 (2, 'ANG-201', 'Angular Web Development',     'Frontend',     60, 15000.00, 'Components, routing, forms, RxJS and HttpClient', 1),
 (3, 'PY-301',  'Python for Data Analysis',    'Data Science', 80, 18000.00, 'Python, NumPy, Pandas and visualisation', 1),
 (4, 'AWS-401', 'AWS Cloud Practitioner',      'Cloud',        40, 12000.00, 'Core AWS services and certification preparation', 1),
 (5, 'SQL-102', 'MySQL Database Fundamentals', 'Database',     30,  8000.00, 'Schema design, SQL queries, joins and indexing', 1),
 (6, 'QA-501',  'Software Testing with Selenium', 'Testing',   50, 14000.00, 'Manual testing basics and Selenium WebDriver', 0);

INSERT INTO trainer (trainer_id, trainer_code, full_name, email, phone, expertise, active) VALUES
 (1, 'TR-001', 'Priya Sharma',  'priya.sharma@skilllab.in',  '9876543210', 'Java, Spring Boot, Microservices', 1),
 (2, 'TR-002', 'Rahul Mehta',   'rahul.mehta@skilllab.in',   '9876543211', 'Angular, TypeScript, UI design', 1),
 (3, 'TR-003', 'Sneha Kulkarni','sneha.kulkarni@skilllab.in','9876543212', 'Python, Data Analysis, ML', 1),
 (4, 'TR-004', 'Arjun Nair',    'arjun.nair@skilllab.in',    '9876543213', 'AWS, DevOps, MySQL', 1),
 (5, 'TR-005', 'Kavita Joshi',  'kavita.joshi@skilllab.in',  '9876543214', 'Software Testing, Selenium', 1);

INSERT INTO student (student_id, student_code, full_name, email, phone, qualification, registration_date, status) VALUES
 (1,  'ST-001', 'Aarav Patil',     'aarav.patil@mail.com',     '9000000001', 'B.E. Computer',   '2026-07-15', 'ACTIVE'),
 (2,  'ST-002', 'Diya Deshmukh',   'diya.deshmukh@mail.com',   '9000000002', 'B.Sc. IT',        '2026-08-02', 'ACTIVE'),
 (3,  'ST-003', 'Rohan Kale',      'rohan.kale@mail.com',      '9000000003', 'BCA',             '2026-09-10', 'ACTIVE'),
 (4,  'ST-004', 'Ananya Iyer',     'ananya.iyer@mail.com',     '9000000004', 'B.Tech IT',       '2026-10-01', 'ACTIVE'),
 (5,  'ST-005', 'Vihaan Gupta',    'vihaan.gupta@mail.com',    '9000000005', 'MCA',             '2026-10-05', 'ACTIVE'),
 (6,  'ST-006', 'Isha Pawar',      'isha.pawar@mail.com',      '9000000006', 'B.E. E&TC',       '2026-10-12', 'ACTIVE'),
 (7,  'ST-007', 'Kabir Singh',     'kabir.singh@mail.com',     '9000000007', 'B.Com',           '2026-07-20', 'ACTIVE'),
 (8,  'ST-008', 'Meera Joshi',     'meera.joshi@mail.com',     '9000000008', 'B.Sc. Computer',  '2026-11-01', 'ACTIVE'),
 (9,  'ST-009', 'Aditya Rao',      'aditya.rao@mail.com',      '9000000009', 'B.E. Mechanical', '2026-07-25', 'ACTIVE'),
 (10, 'ST-010', 'Sara Khan',       'sara.khan@mail.com',       '9000000010', 'M.Sc. Statistics','2026-11-10', 'ACTIVE'),
 (11, 'ST-011', 'Nikhil Bhosale',  'nikhil.bhosale@mail.com',  '9000000011', 'B.Tech CSE',      '2026-11-15', 'ACTIVE'),
 (12, 'ST-012', 'Pooja Shinde',    'pooja.shinde@mail.com',    '9000000012', 'Diploma IT',      '2026-06-30', 'INACTIVE');

INSERT INTO batch (batch_id, batch_code, course_id, trainer_id, start_date, end_date, mode, capacity, status) VALUES
 (1, 'JAV-NOV26', 1, 1, '2026-11-02', '2027-01-29', 'CLASSROOM', 5,  'RUNNING'),    -- full (5/5)
 (2, 'ANG-NOV26', 2, 2, '2026-11-16', '2026-12-31', 'ONLINE',    10, 'RUNNING'),
 (3, 'PY-DEC26',  3, 3, '2026-12-07', '2027-02-12', 'HYBRID',    8,  'PLANNED'),    -- upcoming
 (4, 'AWS-AUG26', 4, 4, '2026-08-03', '2026-09-25', 'ONLINE',    6,  'COMPLETED'),
 (5, 'SQL-JAN27', 5, 4, '2027-01-11', '2027-02-05', 'CLASSROOM', 12, 'PLANNED'),
 (6, 'ANG-OCT26', 2, 2, '2026-10-01', '2026-10-30', 'CLASSROOM', 10, 'CANCELLED'),
 (7, 'SQL-NOV26', 5, 5, '2026-11-20', '2026-12-18', 'CLASSROOM', 10, 'PLANNED');    -- delayed

INSERT INTO enrolment (student_id, batch_id, enrolment_date, status, attendance_percentage, remarks) VALUES
 (1, 1, '2026-10-20 10:00:00', 'ENROLLED',   92.50, NULL),
 (2, 1, '2026-10-21 11:30:00', 'ENROLLED',   88.00, NULL),
 (3, 1, '2026-10-22 09:15:00', 'ENROLLED',   75.00, 'Missed week 2'),
 (4, 1, '2026-10-25 14:00:00', 'ENROLLED',   95.00, NULL),
 (5, 1, '2026-10-28 16:45:00', 'ENROLLED',   81.25, NULL),
 (6, 1, '2026-10-30 10:10:00', 'WAITLISTED',  0.00, 'Waiting for a seat'),
 (6, 2, '2026-11-05 12:00:00', 'ENROLLED',   90.00, NULL),
 (7, 2, '2026-11-06 12:30:00', 'ENROLLED',   85.00, NULL),
 (8, 2, '2026-11-08 15:00:00', 'ENROLLED',   70.00, NULL),
 (9, 2, '2026-11-09 17:20:00', 'WITHDRAWN',   0.00, 'Schedule clash'),
 (10, 3, '2026-11-18 10:00:00', 'ENROLLED',   0.00, NULL),
 (11, 3, '2026-11-20 11:00:00', 'ENROLLED',   0.00, NULL),
 (1, 4, '2026-07-25 09:00:00', 'COMPLETED',  88.00, 'Certified'),
 (7, 4, '2026-07-26 09:30:00', 'COMPLETED',  92.00, 'Certified'),
 (9, 4, '2026-07-28 10:00:00', 'COMPLETED',  76.50, NULL),
 (2, 6, '2026-09-20 13:00:00', 'WITHDRAWN',   0.00, 'Batch cancelled'),
 (3, 7, '2026-11-12 10:30:00', 'ENROLLED',    0.00, NULL);
