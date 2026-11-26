"""Runs the BatchWise API test cases against localhost:8080 and writes docs/test-cases.md (usage: python3 docs/run-api-tests.py).
Temporary records use TC-* codes and are deleted at the end (cleanup also counts as test steps)."""
import datetime, json, os, urllib.error, urllib.request

BASE = 'http://localhost:8080/api'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test-cases.md')
rows, ids = [], {}

def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, (json.loads(raw) if raw else None)

def short(body):
    return json.dumps(body, separators=(',', ':')) if body is not None else '—'

def tc(module, scenario, method, path, body, expected, check=None, note=None):
    status, resp = call(method, path, body)
    ok = status == expected and (check is None or check(resp))
    if isinstance(resp, dict) and 'message' in resp and status >= 400:
        actual = f'{status} – {resp["message"]}'
        if resp.get('fieldErrors') and resp['message'] == 'Validation failed':
            actual += ': ' + '; '.join(f'{k}: {v}' for k, v in list(resp['fieldErrors'].items())[:3])
    elif note and resp is not None:
        actual = f'{status} – {note(resp)}'
    else:
        actual = str(status) + (' – no content' if status == 204 else '')
    rows.append((module, scenario, f'{method} {path}', short(body), str(expected), actual, 'PASS' if ok else 'FAIL'))
    return resp

COURSE = {'courseCode': 'TC-COURSE', 'title': 'Test Automation Course', 'category': 'Testing',
          'durationHours': 40, 'fee': 9999.00, 'description': 'Created by test run', 'active': True}
TRAINER = {'trainerCode': 'TC-TRN', 'fullName': 'Test Trainer', 'email': 'tc.trainer@example.com',
           'phone': '9000000001', 'expertise': 'QA', 'active': True}
def student(n):
    return {'studentCode': f'TC-STU{n}', 'fullName': f'Test Student {n}', 'email': f'tc.student{n}@example.com',
            'phone': f'900000001{n}', 'qualification': 'B.Sc', 'registrationDate': '2026-11-20', 'status': 'ACTIVE'}
def batch(**kw):
    b = {'batchCode': 'TC-BATCH', 'courseId': ids.get('course'), 'trainerId': ids.get('trainer'),
         'startDate': '2027-03-01', 'endDate': '2027-04-30', 'mode': 'ONLINE', 'capacity': 1, 'status': 'PLANNED'}
    b.update(kw); return b

try:
    # ---------- Courses ----------
    tc('Course', 'List all courses', 'GET', '/courses', None, 200, lambda r: len(r) > 0, lambda r: f'{len(r)} courses')
    tc('Course', 'Search active courses by keyword', 'GET', '/courses?search=java&active=true', None, 200,
       lambda r: all(c['active'] for c in r) and any('JAV' in c['courseCode'] for c in r), lambda r: ', '.join(c['courseCode'] for c in r))
    tc('Course', 'Get course by id', 'GET', '/courses/1', None, 200, lambda r: r['courseId'] == 1, lambda r: r['courseCode'])
    tc('Course', 'Get course that does not exist', 'GET', '/courses/9999', None, 404)
    r = tc('Course', 'Create course with valid data', 'POST', '/courses', COURSE, 201, lambda r: r['courseCode'] == 'TC-COURSE',
           lambda r: f'created courseId={r["courseId"]}')
    ids['course'] = r['courseId']
    tc('Course', 'Create course with empty body', 'POST', '/courses', {}, 400)
    tc('Course', 'Create course with negative fee and 0 hours', 'POST', '/courses', {**COURSE, 'courseCode': 'TC-X', 'fee': -1, 'durationHours': 0}, 400)
    tc('Course', 'Duplicate course code', 'POST', '/courses', {**COURSE, 'courseCode': 'JAV-101'}, 409)
    tc('Course', 'Update course details', 'PUT', f'/courses/{ids["course"]}', {**COURSE, 'fee': 10500.00}, 200,
       lambda r: float(r['fee']) == 10500.0, lambda r: f'fee={r["fee"]}')
    tc('Course', 'Delete course that has batches', 'DELETE', '/courses/1', None, 409)

    # ---------- Trainers ----------
    r = tc('Trainer', 'Create trainer with valid data', 'POST', '/trainers', TRAINER, 201, None, lambda r: f'created trainerId={r["trainerId"]}')
    ids['trainer'] = r['trainerId']
    tc('Trainer', 'Invalid email and phone', 'POST', '/trainers', {**TRAINER, 'trainerCode': 'TC-X', 'email': 'abc', 'phone': '123'}, 400)
    tc('Trainer', 'Duplicate trainer email', 'POST', '/trainers', {**TRAINER, 'trainerCode': 'TC-X', 'email': 'priya.sharma@skilllab.in'}, 409)
    tc('Trainer', 'List active trainers', 'GET', '/trainers?active=true', None, 200, lambda r: all(t['active'] for t in r), lambda r: f'{len(r)} active trainers')

    # ---------- Students ----------
    r = tc('Student', 'Register student with valid data', 'POST', '/students', student(1), 201, None, lambda r: f'created studentId={r["studentId"]}')
    ids['s1'] = r['studentId']
    ids['s2'] = call('POST', '/students', student(2))[1]['studentId']  # setup: second student for waitlist tests
    tc('Student', 'Registration date in the future', 'POST', '/students', {**student(3), 'registrationDate': '2030-01-01'}, 400)
    tc('Student', 'Search students by name', 'GET', '/students?search=patil', None, 200,
       lambda r: len(r) > 0, lambda r: ', '.join(s['fullName'] for s in r))
    tc('Student', 'Filter inactive students', 'GET', '/students?status=INACTIVE', None, 200,
       lambda r: all(s['status'] == 'INACTIVE' for s in r), lambda r: f'{len(r)} inactive')

    # ---------- Batches ----------
    r = tc('Batch', 'Schedule batch (capacity 1)', 'POST', '/batches', batch(), 201, lambda r: r['status'] == 'PLANNED',
           lambda r: f'created batchId={r["batchId"]}, seats 0/1')
    ids['batch'] = r['batchId']
    tc('Batch', 'End date before start date', 'POST', '/batches', batch(batchCode='TC-B2', endDate='2027-02-01'), 400)
    tc('Batch', 'Trainer double booking (overlapping dates)', 'POST', '/batches', batch(batchCode='TC-B2', startDate='2027-04-01', endDate='2027-05-15'), 409)
    tc('Batch', 'Schedule batch for an inactive course', 'POST', '/batches', batch(batchCode='TC-B2', courseId=6), 409)
    tc('Batch', 'Invalid mode value', 'POST', '/batches', batch(batchCode='TC-B2', mode='XYZ'), 400)
    tc('Batch', 'Batch summary with roster', 'GET', '/batches/1/summary', None, 200,
       lambda r: 'roster' in r and 'seats' in r['batch'], lambda r: f'{r["batch"]["seats"]["occupied"]}/{r["batch"]["capacity"]} seats, {len(r["roster"])} on roster')
    tc('Batch', 'Filter running batches', 'GET', '/batches?status=RUNNING', None, 200,
       lambda r: all(b['status'] == 'RUNNING' for b in r), lambda r: ', '.join(b['batchCode'] for b in r))
    tc('Batch', 'Delete batch that has enrolments', 'DELETE', '/batches/1', None, 409)

    # ---------- Enrolments ----------
    enrol = lambda s, st='ENROLLED': {'studentId': ids[s] if isinstance(s, str) else s, 'batchId': ids['batch'], 'status': st,
                                      'attendancePercentage': 0, 'remarks': None}
    r = tc('Enrolment', 'Enrol student into batch with free seat', 'POST', '/enrolments', enrol('s1'), 201,
           lambda r: r['status'] == 'ENROLLED', lambda r: f'enrolmentId={r["enrolmentId"]}, ENROLLED')
    ids['e1'] = r['enrolmentId']
    tc('Enrolment', 'Duplicate active enrolment (same student & batch)', 'POST', '/enrolments', enrol('s1'), 409)
    tc('Enrolment', 'Enrol into a FULL batch', 'POST', '/enrolments', enrol('s2'), 409)
    r = tc('Enrolment', 'Waitlist student when batch is full', 'POST', '/enrolments', enrol('s2', 'WAITLISTED'), 201,
           lambda r: r['status'] == 'WAITLISTED', lambda r: f'enrolmentId={r["enrolmentId"]}, WAITLISTED')
    ids['e2'] = r['enrolmentId']
    tc('Enrolment', 'Enrol an inactive student', 'POST', '/enrolments', enrol(12), 409)
    tc('Enrolment', 'Enrol into a COMPLETED batch', 'POST', '/enrolments', {**enrol('s2'), 'batchId': 4}, 409)
    tc('Enrolment', 'Update attendance', 'PUT', f'/enrolments/{ids["e1"]}', {**enrol('s1'), 'attendancePercentage': 85.5, 'remarks': 'Good progress'}, 200,
       lambda r: float(r['attendancePercentage']) == 85.5, lambda r: f'attendance={r["attendancePercentage"]}%')
    tc('Enrolment', 'Attendance above 100', 'PUT', f'/enrolments/{ids["e1"]}', {**enrol('s1'), 'attendancePercentage': 150}, 400)
    tc('Enrolment', 'Delete an ENROLLED enrolment', 'DELETE', f'/enrolments/{ids["e1"]}', None, 409)
    tc('Enrolment', 'Withdraw student (frees the seat)', 'PATCH', f'/enrolments/{ids["e1"]}/status?status=WITHDRAWN', None, 200,
       lambda r: r['status'] == 'WITHDRAWN', lambda r: r['status'])
    tc('Batch', 'Seat count drops after withdrawal', 'GET', f'/batches/{ids["batch"]}', None, 200,
       lambda r: r['seats']['occupied'] == 0, lambda r: f'occupied {r["seats"]["occupied"]}/{r["capacity"]}')
    tc('Enrolment', 'Move waitlisted student into the freed seat', 'PATCH', f'/enrolments/{ids["e2"]}/status?status=ENROLLED', None, 200,
       lambda r: r['status'] == 'ENROLLED', lambda r: r['status'])
    tc('Batch', 'Cancel batch (soft delete, withdraws students)', 'PATCH', f'/batches/{ids["batch"]}/status?status=CANCELLED', None, 200,
       lambda r: r['status'] == 'CANCELLED' and r['seats']['occupied'] == 0, lambda r: f'{r["status"]}, occupied {r["seats"]["occupied"]}')
    tc('Batch', 'Reopen a CANCELLED batch', 'PATCH', f'/batches/{ids["batch"]}/status?status=RUNNING', None, 409)

    tc('Dashboard', 'Dashboard counts', 'GET', '/dashboard', None, 200,
       lambda r: 'activeCourses' in r, lambda r: f'{r["activeCourses"]} active courses, {r["runningBatches"]} running batches, {r["enrolledCount"]} enrolled')

    # ---------- Cleanup (also verifies deletes that are allowed) ----------
    tc('Enrolment', 'Delete a WITHDRAWN enrolment', 'DELETE', f'/enrolments/{ids["e1"]}', None, 204)
    call('DELETE', f'/enrolments/{ids["e2"]}')
    tc('Batch', 'Delete batch with no enrolments', 'DELETE', f'/batches/{ids["batch"]}', None, 204)
    tc('Course', 'Delete course with no batches', 'DELETE', f'/courses/{ids["course"]}', None, 204)
    tc('Trainer', 'Delete trainer with no batches', 'DELETE', f'/trainers/{ids["trainer"]}', None, 204)
    tc('Student', 'Delete student with no enrolments', 'DELETE', f'/students/{ids["s1"]}', None, 204)
finally:
    # safety net: remove anything still left from this run
    for k, path in [('e1', 'enrolments'), ('e2', 'enrolments'), ('batch', 'batches'), ('course', 'courses'),
                    ('trainer', 'trainers'), ('s1', 'students'), ('s2', 'students')]:
        if k in ids:
            if k in ('e1', 'e2'):
                call('PATCH', f'/enrolments/{ids[k]}/status?status=WITHDRAWN')
            call('DELETE', f'/{path}/{ids[k]}')

passed = sum(r[-1] == 'PASS' for r in rows)
def esc(s): return s.replace('|', '\\|')
lines = [
    '# BatchWise – API Test Cases',
    '',
    f'Executed against `http://localhost:8080/api` on {datetime.date.today():%d %b %Y}. '
    f'**{passed} of {len(rows)} passed.**',
    '',
    'Each case was sent to the running Spring Boot API; *Actual* is the real response. '
    'Temporary `TC-*` records created by the run are deleted at the end (the last delete cases), '
    'so the database is left as it was.',
    '',
    '| ID | Module | Scenario | Request | Input (JSON body) | Expected | Actual | Result |',
    '|---|---|---|---|---|---|---|---|',
]
for i, (m, s, req, inp, exp, act, res) in enumerate(rows, 1):
    inp_cell = '—' if inp == '—' else f'`{esc(inp[:140])}{"…" if len(inp) > 140 else ""}`'
    lines.append(f'| TC{i:02d} | {m} | {s} | `{esc(req)}` | {inp_cell} | {exp} | {esc(act)} | {"✅ PASS" if res == "PASS" else "❌ FAIL"} |')
open(OUT, 'w').write('\n'.join(lines) + '\n')
print(f'{passed}/{len(rows)} passed')
for i, r in enumerate(rows, 1):
    if r[-1] != 'PASS':
        print(f'TC{i:02d}', r)
