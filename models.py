import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone


class ClassRoom(models.Model):
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=32, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class AttendanceSession(models.Model):
    classroom = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_by = models.ForeignKey(
        'teacher.Teacher',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sessions'
    )
    start_time = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(blank=True)
    active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = self.start_time + timedelta(seconds=60)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return self.active and timezone.now() <= self.expires_at

    def __str__(self):
        return f"Session {self.classroom.code} - {self.token}"


class AttendanceRecord(models.Model):
    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name='records'
    )
    student = models.ForeignKey(
        'student.Student',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    present = models.BooleanField(default=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.roll_number} - {self.session.classroom.code}"


