from rest_framework import serializers

from .models import ClassRoom, AttendanceSession


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = ('id', 'name', 'code', 'description')


class AttendanceSessionSerializer(serializers.ModelSerializer):
    classroom = ClassRoomSerializer(read_only=True)
    teacher = serializers.CharField(source='created_by.user.username', read_only=True)

    class Meta:
        model = AttendanceSession
        fields = ('token', 'classroom', 'teacher', 'start_time', 'expires_at', 'active')
