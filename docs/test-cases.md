# BatchWise – API Test Cases

Executed against `http://localhost:8080/api` on 26 Nov 2026. **46 of 46 passed.**

Each case was sent to the running Spring Boot API; *Actual* is the real response. Temporary `TC-*` records created by the run are deleted at the end (the last delete cases), so the database is left as it was.

| ID | Module | Scenario | Request | Input (JSON body) | Expected | Actual | Result |
|---|---|---|---|---|---|---|---|
| TC01 | Course | List all courses | `GET /courses` | — | 200 | 200 – 7 courses | ✅ PASS |
| TC02 | Course | Search active courses by keyword | `GET /courses?search=java&active=true` | — | 200 | 200 – JAV-101 | ✅ PASS |
| TC03 | Course | Get course by id | `GET /courses/1` | — | 200 | 200 – JAV-101 | ✅ PASS |
| TC04 | Course | Get course that does not exist | `GET /courses/9999` | — | 404 | 404 – Course not found with id 9999 | ✅ PASS |
| TC05 | Course | Create course with valid data | `POST /courses` | `{"courseCode":"TC-COURSE","title":"Test Automation Course","category":"Testing","durationHours":40,"fee":9999.0,"description":"Created by te…` | 201 | 201 – created courseId=8 | ✅ PASS |
| TC06 | Course | Create course with empty body | `POST /courses` | `{}` | 400 | 400 – Validation failed: category: Category is required; durationHours: Duration is required; fee: Fee is required | ✅ PASS |
| TC07 | Course | Create course with negative fee and 0 hours | `POST /courses` | `{"courseCode":"TC-X","title":"Test Automation Course","category":"Testing","durationHours":0,"fee":-1,"description":"Created by test run","a…` | 400 | 400 – Validation failed: fee: Fee cannot be negative; durationHours: Duration must be at least 1 hour | ✅ PASS |
| TC08 | Course | Duplicate course code | `POST /courses` | `{"courseCode":"JAV-101","title":"Test Automation Course","category":"Testing","durationHours":40,"fee":9999.0,"description":"Created by test…` | 409 | 409 – Course code JAV-101 already exists | ✅ PASS |
| TC09 | Course | Update course details | `PUT /courses/8` | `{"courseCode":"TC-COURSE","title":"Test Automation Course","category":"Testing","durationHours":40,"fee":10500.0,"description":"Created by t…` | 200 | 200 – fee=10500.0 | ✅ PASS |
| TC10 | Course | Delete course that has batches | `DELETE /courses/1` | — | 409 | 409 – Course JAV-101 has batches and cannot be deleted. Deactivate it instead. | ✅ PASS |
| TC11 | Trainer | Create trainer with valid data | `POST /trainers` | `{"trainerCode":"TC-TRN","fullName":"Test Trainer","email":"tc.trainer@example.com","phone":"9000000001","expertise":"QA","active":true}` | 201 | 201 – created trainerId=7 | ✅ PASS |
| TC12 | Trainer | Invalid email and phone | `POST /trainers` | `{"trainerCode":"TC-X","fullName":"Test Trainer","email":"abc","phone":"123","expertise":"QA","active":true}` | 400 | 400 – Validation failed: email: Email must be a valid address; phone: Phone must be 10-14 digits, optionally starting with + | ✅ PASS |
| TC13 | Trainer | Duplicate trainer email | `POST /trainers` | `{"trainerCode":"TC-X","fullName":"Test Trainer","email":"priya.sharma@skilllab.in","phone":"9000000001","expertise":"QA","active":true}` | 409 | 409 – A trainer with email priya.sharma@skilllab.in already exists | ✅ PASS |
| TC14 | Trainer | List active trainers | `GET /trainers?active=true` | — | 200 | 200 – 7 active trainers | ✅ PASS |
| TC15 | Student | Register student with valid data | `POST /students` | `{"studentCode":"TC-STU1","fullName":"Test Student 1","email":"tc.student1@example.com","phone":"9000000011","qualification":"B.Sc","registra…` | 201 | 201 – created studentId=14 | ✅ PASS |
| TC16 | Student | Registration date in the future | `POST /students` | `{"studentCode":"TC-STU3","fullName":"Test Student 3","email":"tc.student3@example.com","phone":"9000000013","qualification":"B.Sc","registra…` | 400 | 400 – Validation failed: registrationDate: Registration date cannot be in the future | ✅ PASS |
| TC17 | Student | Search students by name | `GET /students?search=patil` | — | 200 | 200 – Atharva Patil, Aarav Patil | ✅ PASS |
| TC18 | Student | Filter inactive students | `GET /students?status=INACTIVE` | — | 200 | 200 – 1 inactive | ✅ PASS |
| TC19 | Batch | Schedule batch (capacity 1) | `POST /batches` | `{"batchCode":"TC-BATCH","courseId":8,"trainerId":7,"startDate":"2027-03-01","endDate":"2027-04-30","mode":"ONLINE","capacity":1,"status":"PL…` | 201 | 201 – created batchId=9, seats 0/1 | ✅ PASS |
| TC20 | Batch | End date before start date | `POST /batches` | `{"batchCode":"TC-B2","courseId":8,"trainerId":7,"startDate":"2027-03-01","endDate":"2027-02-01","mode":"ONLINE","capacity":1,"status":"PLANN…` | 400 | 400 – Validation failed: endDateValid: End date must be on or after start date | ✅ PASS |
| TC21 | Batch | Trainer double booking (overlapping dates) | `POST /batches` | `{"batchCode":"TC-B2","courseId":8,"trainerId":7,"startDate":"2027-04-01","endDate":"2027-05-15","mode":"ONLINE","capacity":1,"status":"PLANN…` | 409 | 409 – Trainer Test Trainer already has a batch between 2027-04-01 and 2027-05-15 | ✅ PASS |
| TC22 | Batch | Schedule batch for an inactive course | `POST /batches` | `{"batchCode":"TC-B2","courseId":6,"trainerId":7,"startDate":"2027-03-01","endDate":"2027-04-30","mode":"ONLINE","capacity":1,"status":"PLANN…` | 409 | 409 – Course QA-501 is inactive | ✅ PASS |
| TC23 | Batch | Invalid mode value | `POST /batches` | `{"batchCode":"TC-B2","courseId":8,"trainerId":7,"startDate":"2027-03-01","endDate":"2027-04-30","mode":"XYZ","capacity":1,"status":"PLANNED"…` | 400 | 400 – Malformed request body - check JSON syntax, date format (yyyy-MM-dd) and allowed values | ✅ PASS |
| TC24 | Batch | Batch summary with roster | `GET /batches/1/summary` | — | 200 | 200 – 5/5 seats, 6 on roster | ✅ PASS |
| TC25 | Batch | Filter running batches | `GET /batches?status=RUNNING` | — | 200 | 200 – ANG-NOV26, JAV-NOV26 | ✅ PASS |
| TC26 | Batch | Delete batch that has enrolments | `DELETE /batches/1` | — | 409 | 409 – Batch JAV-NOV26 has enrolments and cannot be deleted. Cancel the batch instead. | ✅ PASS |
| TC27 | Enrolment | Enrol student into batch with free seat | `POST /enrolments` | `{"studentId":14,"batchId":9,"status":"ENROLLED","attendancePercentage":0,"remarks":null}` | 201 | 201 – enrolmentId=20, ENROLLED | ✅ PASS |
| TC28 | Enrolment | Duplicate active enrolment (same student & batch) | `POST /enrolments` | `{"studentId":14,"batchId":9,"status":"ENROLLED","attendancePercentage":0,"remarks":null}` | 409 | 409 – Student TC-STU1 is already enrolled or waitlisted in batch TC-BATCH | ✅ PASS |
| TC29 | Enrolment | Enrol into a FULL batch | `POST /enrolments` | `{"studentId":15,"batchId":9,"status":"ENROLLED","attendancePercentage":0,"remarks":null}` | 409 | 409 – Batch TC-BATCH is full (1/1 seats taken). Enrol the student as WAITLISTED instead. | ✅ PASS |
| TC30 | Enrolment | Waitlist student when batch is full | `POST /enrolments` | `{"studentId":15,"batchId":9,"status":"WAITLISTED","attendancePercentage":0,"remarks":null}` | 201 | 201 – enrolmentId=21, WAITLISTED | ✅ PASS |
| TC31 | Enrolment | Enrol an inactive student | `POST /enrolments` | `{"studentId":12,"batchId":9,"status":"ENROLLED","attendancePercentage":0,"remarks":null}` | 409 | 409 – Student ST-012 is inactive | ✅ PASS |
| TC32 | Enrolment | Enrol into a COMPLETED batch | `POST /enrolments` | `{"studentId":15,"batchId":4,"status":"ENROLLED","attendancePercentage":0,"remarks":null}` | 409 | 409 – Batch AWS-AUG26 is COMPLETED and is not accepting enrolments | ✅ PASS |
| TC33 | Enrolment | Update attendance | `PUT /enrolments/20` | `{"studentId":14,"batchId":9,"status":"ENROLLED","attendancePercentage":85.5,"remarks":"Good progress"}` | 200 | 200 – attendance=85.5% | ✅ PASS |
| TC34 | Enrolment | Attendance above 100 | `PUT /enrolments/20` | `{"studentId":14,"batchId":9,"status":"ENROLLED","attendancePercentage":150,"remarks":null}` | 400 | 400 – Validation failed: attendancePercentage: Attendance cannot exceed 100 | ✅ PASS |
| TC35 | Enrolment | Delete an ENROLLED enrolment | `DELETE /enrolments/20` | — | 409 | 409 – An ENROLLED enrolment cannot be deleted. Withdraw it instead. | ✅ PASS |
| TC36 | Enrolment | Withdraw student (frees the seat) | `PATCH /enrolments/20/status?status=WITHDRAWN` | — | 200 | 200 – WITHDRAWN | ✅ PASS |
| TC37 | Batch | Seat count drops after withdrawal | `GET /batches/9` | — | 200 | 200 – occupied 0/1 | ✅ PASS |
| TC38 | Enrolment | Move waitlisted student into the freed seat | `PATCH /enrolments/21/status?status=ENROLLED` | — | 200 | 200 – ENROLLED | ✅ PASS |
| TC39 | Batch | Cancel batch (soft delete, withdraws students) | `PATCH /batches/9/status?status=CANCELLED` | — | 200 | 200 – CANCELLED, occupied 0 | ✅ PASS |
| TC40 | Batch | Reopen a CANCELLED batch | `PATCH /batches/9/status?status=RUNNING` | — | 409 | 409 – A CANCELLED batch cannot be reopened | ✅ PASS |
| TC41 | Dashboard | Dashboard counts | `GET /dashboard` | — | 200 | 200 – 7 active courses, 2 running batches, 13 enrolled | ✅ PASS |
| TC42 | Enrolment | Delete a WITHDRAWN enrolment | `DELETE /enrolments/20` | — | 204 | 204 – no content | ✅ PASS |
| TC43 | Batch | Delete batch with no enrolments | `DELETE /batches/9` | — | 204 | 204 – no content | ✅ PASS |
| TC44 | Course | Delete course with no batches | `DELETE /courses/8` | — | 204 | 204 – no content | ✅ PASS |
| TC45 | Trainer | Delete trainer with no batches | `DELETE /trainers/7` | — | 204 | 204 – no content | ✅ PASS |
| TC46 | Student | Delete student with no enrolments | `DELETE /students/14` | — | 204 | 204 – no content | ✅ PASS |
