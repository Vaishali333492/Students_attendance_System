from django.contrib import admin
from .models import ClassRoom, AttendanceSession, AttendanceRecord

admin.site.register(ClassRoom)
admin.site.register(AttendanceSession)
admin.site.register(AttendanceRecord)
