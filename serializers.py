from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    department = serializers.CharField(write_only=True, required=False, default='General')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'phone', 'role', 'password', 'department')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        department = validated_data.pop('department', 'General')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            phone=validated_data.get('phone'),
            role=validated_data['role'],
            password=validated_data['password'],
        )

        # Auto-create profile based on role
        if user.role == 'student':
            from student.models import Student
            Student.objects.create(
                user=user,
                roll_number=f"{department[:3].upper()}-{user.username}",
                department=department,
                semester=4,
            )
        elif user.role == 'teacher':
            from teacher.models import Teacher
            Teacher.objects.create(
                user=user,
                department=department,
                designation='Faculty',
            )

        return user