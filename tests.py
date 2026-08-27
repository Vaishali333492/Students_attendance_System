from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from accounts.models import User
from attendance.models import AttendanceRecord, AttendanceSession, ClassRoom
from student.models import Student
from teacher.models import Teacher


class ScanAttendanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher_user = User.objects.create_user(
            username='teacher1',
            password='secret123',
            role='teacher',
        )
        self.teacher = Teacher.objects.create(
            user=self.teacher_user,
            department='Computer Science',
            designation='Lecturer',
        )
        self.classroom = ClassRoom.objects.create(
            name='Mathematics',
            code='MATH101',
            description='Morning class',
        )
        self.classroom.teachers.add(self.teacher)

        self.student_user = User.objects.create_user(
            username='student1',
            password='secret123',
            role='student',
        )
        self.student = Student.objects.create(
            user=self.student_user,
            roll_number='S101',
            department='Computer Science',
            semester=3,
        )
        self.student.classes.add(self.classroom)

        self.session = AttendanceSession.objects.create(
            classroom=self.classroom,
            created_by=self.teacher,
        )

    def test_scan_attendance_accepts_student_name(self):
        """Test that attendance is stored with student name"""
        response = self.client.post(
            reverse('scan-attendance'),
            {
                'token': str(self.session.token),
                'roll_number': 'S101',
                'name': 'Asha Kumar',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(AttendanceRecord.objects.filter(session=self.session, student=self.student).exists())
        self.assertIn('Asha Kumar', response.data['message'])

    def test_attendance_record_stored_in_database(self):
        """Test that attendance record is properly stored in database"""
        response = self.client.post(
            reverse('scan-attendance'),
            {
                'token': str(self.session.token),
                'roll_number': 'S101',
                'name': 'John Doe',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        
        # Verify record in database
        record = AttendanceRecord.objects.get(session=self.session, student=self.student)
        self.assertTrue(record.present)
        self.assertIsNotNone(record.timestamp)
        self.assertEqual(record.student.roll_number, 'S101')

    def test_expired_qr_session_rejected(self):
        """Test that expired QR sessions are rejected"""
        # Create an expired session
        expired_session = AttendanceSession.objects.create(
            classroom=self.classroom,
            created_by=self.teacher,
            start_time=timezone.now() - timedelta(seconds=70),
            expires_at=timezone.now() - timedelta(seconds=10),
            active=False,
        )

        response = self.client.post(
            reverse('scan-attendance'),
            {
                'token': str(expired_session.token),
                'roll_number': 'S101',
                'name': 'John Doe',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid or expired', response.data['message'])

    def test_duplicate_attendance_rejected(self):
        """Test that duplicate scans are rejected"""
        # First scan
        response1 = self.client.post(
            reverse('scan-attendance'),
            {
                'token': str(self.session.token),
                'roll_number': 'S101',
                'name': 'John Doe',
            },
            format='json',
        )
        self.assertEqual(response1.status_code, 201)

        # Second scan with same token
        response2 = self.client.post(
            reverse('scan-attendance'),
            {
                'token': str(self.session.token),
                'roll_number': 'S101',
                'name': 'John Doe',
            },
            format='json',
        )
        self.assertEqual(response2.status_code, 200)
        self.assertIn('already recorded', response2.data['message'])

    def test_student_subject_association(self):
        """Test that attendance is linked to correct subject"""
        response = self.client.post(
            reverse('scan-attendance'),
            {
                'token': str(self.session.token),
                'roll_number': 'S101',
                'name': 'John Doe',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        
        # Verify attendance is linked to correct classroom/subject
        record = AttendanceRecord.objects.get(session=self.session, student=self.student)
        self.assertEqual(record.session.classroom, self.classroom)
        self.assertEqual(record.session.classroom.name, 'Mathematics')
