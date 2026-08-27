import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from attendance.models import ClassRoom
from teacher.models import Teacher
from student.models import Student


DEPARTMENTS = [
    ('Computer Engineering', 'CE'),
    ('CSE', 'CSE'),
    ('CSIT', 'CSIT'),
    ('IT', 'IT'),
    ('AIML', 'AIML'),
    ('AIDS', 'AIDS'),
]

SUBJECTS = ['FCSP-2', 'FSD-2', 'DM', 'TOC', 'COA']

SUBJECT_NAMES = {
    'FCSP-2': 'Fundamentals of Computer Science Programming 2',
    'FSD-2': 'Full Stack Development 2',
    'DM': 'Discrete Mathematics',
    'TOC': 'Theory of Computation',
    'COA': 'Computer Organization and Architecture',
}


def seed():
    print("=" * 60)
    print("  QR Attendance System - Database Seeder (Semester 4)")
    print("=" * 60)

    # Clear old classrooms to apply clean subject structure
    print("\n[0] Clearing old classrooms...")
    ClassRoom.objects.all().delete()
    print("   [+] Old classrooms cleared.")

    # ── 1. Create Classrooms for Semester 4 (5 subjects × 6 departments) ─────
    print("\n[1] Creating Classrooms (FCSP-2, FSD-2, DM, TOC, COA for Sem 4)...")
    classrooms = {}
    for dept_full, dept_code in DEPARTMENTS:
        for subj in SUBJECTS:
            code = f"{dept_code}-SEM4-{subj}"
            cr, created = ClassRoom.objects.get_or_create(
                code=code,
                defaults={
                    'name': f"{SUBJECT_NAMES[subj]} (Sem 4 - {dept_code})",
                    'description': f"{dept_full} Department - Semester 4 - {subj}",
                }
            )
            classrooms[code] = cr
            if created:
                print(f"   [+] Created: {code} - {cr.name}")

    # ── 2. Create 1 Teacher per Department (6 Teachers) ─────────────────────
    print("\n[2] Creating 1 Teacher per Field (Assigned all 5 Sem 4 subjects)...")
    for dept_full, dept_code in DEPARTMENTS:
        uname = f"teacher_{dept_code.lower()}"
        pwd = "teacher123"
        email = f"teacher_{dept_code.lower()}@college.edu"

        user, created = User.objects.get_or_create(
            username=uname,
            defaults={'email': email, 'role': 'teacher'}
        )
        if created:
            user.set_password(pwd)
            user.save()
            t = Teacher.objects.create(user=user, department=dept_full, designation='Senior Faculty')
        else:
            t, _ = Teacher.objects.get_or_create(user=user, defaults={'department': dept_full, 'designation': 'Senior Faculty'})

        # Clear previous classes and assign all 5 subjects of this department for Sem 4
        t.classes.clear()
        for subj in SUBJECTS:
            code = f"{dept_code}-SEM4-{subj}"
            if code in classrooms:
                t.classes.add(classrooms[code])
        print(f"   [+] Teacher ready: {uname} (Password: {pwd}) -> {dept_full} (5 subjects allocated)")

    # ── 3. Create 10 Students per Department (60 Students) ──────────────────
    print("\n[3] Creating 10 Students per Field (Semester 4, Enrolled in all 5 subjects)...")
    total_students_created = 0

    for dept_full, dept_code in DEPARTMENTS:
        for i in range(1, 11):
            roll_no = f"{dept_code}-SEM4-{i:03d}"
            uname = f"student_{dept_code.lower()}_{i}"
            pwd = "student123"
            email = f"student_{dept_code.lower()}_{i}@college.edu"

            user, created = User.objects.get_or_create(
                username=uname,
                defaults={'email': email, 'role': 'student'}
            )
            if created:
                user.set_password(pwd)
                user.save()
                s = Student.objects.create(
                    user=user, roll_number=roll_no, department=dept_full, semester=4
                )
            else:
                s, _ = Student.objects.get_or_create(
                    user=user,
                    defaults={'roll_number': roll_no, 'department': dept_full, 'semester': 4}
                )
                s.semester = 4
                s.save()

            # Assign all 5 subjects for their department
            s.classes.clear()
            for subj in SUBJECTS:
                code = f"{dept_code}-SEM4-{subj}"
                if code in classrooms:
                    s.classes.add(classrooms[code])

            total_students_created += 1

        print(f"   [+] 10 Students allocated for {dept_full} ({dept_code}-SEM4-001 to 010)")

    print("\n" + "=" * 60)
    print(f"  Seeding Complete!")
    print(f"  - Fields: CE, CSE, CSIT, IT, AIML, AIDS")
    print(f"  - Subjects per field: FCSP-2, FSD-2, DM, TOC, COA (Semester 4)")
    print(f"  - Total Teachers: 6 (1 per field, all 5 subjects assigned)")
    print(f"  - Total Students: {total_students_created} (10 per field, Semester 4)")
    print("=" * 60)


if __name__ == '__main__':
    seed()
