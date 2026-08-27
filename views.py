from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import ClassRoom, AttendanceSession, AttendanceRecord
from .serializers import ClassRoomSerializer, AttendanceSessionSerializer
from student.models import Student
from teacher.models import Teacher


@api_view(['GET'])
def classroom_list(request):
    classrooms = ClassRoom.objects.all()
    serializer = ClassRoomSerializer(classrooms, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def generate_qr_token(request):
    """TEACHER ONLY: Generates a 60-second QR session for a classroom."""
    classroom_id = request.data.get('classroom_id')
    teacher_id = request.data.get('teacher_id')  # this is the User ID
    lat = request.data.get('latitude')
    lon = request.data.get('longitude')

    if not classroom_id or not teacher_id:
        return Response(
            {"message": "classroom_id and teacher_id are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        teacher = Teacher.objects.get(user_id=teacher_id)
    except Teacher.DoesNotExist:
        return Response(
            {"message": "Only teachers can generate QR codes. No teacher profile found."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        classroom = ClassRoom.objects.get(id=classroom_id)
    except ClassRoom.DoesNotExist:
        return Response(
            {"message": "Classroom not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    session = AttendanceSession.objects.create(
        classroom=classroom,
        created_by=teacher,
        latitude=float(lat) if lat is not None else None,
        longitude=float(lon) if lon is not None else None
    )

    serializer = AttendanceSessionSerializer(session)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_attendance(request):
    """STUDENT: Scans QR token + provides roll number to mark attendance."""
    token = request.data.get('token')
    roll_number = request.data.get('roll_number')
    student_name = request.data.get('name') or request.data.get('student_name')
    student_lat = request.data.get('latitude')
    student_lon = request.data.get('longitude')

    if not token or not roll_number:
        return Response(
            {"message": "token and roll_number are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = AttendanceSession.objects.get(token=token, active=True)
    except AttendanceSession.DoesNotExist:
        return Response(
            {"message": "Invalid or expired QR code. Ask your teacher to generate a new one."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if timezone.now() > session.expires_at:
        session.active = False
        session.save()
        return Response(
            {"message": "QR code has expired (60 second limit). Ask teacher to regenerate."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 1. Authorize User role
    if request.user.role != 'student':
        return Response(
            {"message": "Only students are authorized to scan and mark attendance."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        student = request.user.student_profile
    except AttributeError:
        return Response(
            {"message": "User does not have a student profile created."},
            status=status.HTTP_403_FORBIDDEN
        )

    # 2. Block Roll Number Spoofing
    if roll_number.strip().upper() != student.roll_number.upper():
        return Response(
            {"message": "Security Alert: You can only record attendance for your own account!"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 3. Location Proximity Check
    if session.latitude is not None and session.longitude is not None:
        if student_lat is None or student_lon is None:
            return Response(
                {"message": "Location access is required to verify you are present in the classroom."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate Haversine Distance
        import math
        def calc_distance(lat1, lon1, lat2, lon2):
            R = 6371000  # meters
            to_rad = lambda x: (x * math.pi) / 180
            d_lat = to_rad(lat2 - lat1)
            d_lon = to_rad(lon2 - lon1)
            a = (math.sin(d_lat / 2) ** 2 +
                 math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * (math.sin(d_lon / 2) ** 2))
            return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = calc_distance(
            float(student_lat), float(student_lon),
            session.latitude, session.longitude
        )

        if distance > 50:
            return Response(
                {"message": f"Geo-restriction failed. You are {round(distance)} meters from the teacher (Limit: 50m)."},
                status=status.HTTP_400_BAD_REQUEST
            )

    record, created = AttendanceRecord.objects.get_or_create(
        session=session,
        student=student,
        defaults={"present": True}
    )

    if not created:
        return Response(
            {"message": "Attendance already recorded for this session."},
            status=status.HTTP_200_OK
        )

    display_name = student_name or student.user.username
    return Response(
        {"message": f"Attendance marked present for {display_name} in {session.classroom.name}!"},
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
def student_attendance_summary(request, pk):
    """Summary for student dashboard -- pk is the User ID."""
    try:
        student = Student.objects.get(user_id=pk)
    except Student.DoesNotExist:
        return Response(
            {"message": "Student profile not found for this user."},
            status=status.HTTP_404_NOT_FOUND
        )

    now = timezone.now()
    start_of_week  = now - timedelta(days=now.weekday())
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Overall attendance counts
    all_records = AttendanceRecord.objects.filter(student=student, present=True)
    daily   = all_records.filter(timestamp__date=now.date()).count()
    weekly  = all_records.filter(timestamp__date__gte=start_of_week.date()).count()
    monthly = all_records.filter(timestamp__date__gte=start_of_month.date()).count()
    total   = all_records.count()

    # Per-subject (classroom) real attendance data
    classes = []
    for c in student.classes.all():
        subj_records = all_records.filter(session__classroom=c)
        subj_daily   = subj_records.filter(timestamp__date=now.date()).count()
        subj_weekly  = subj_records.filter(timestamp__date__gte=start_of_week.date()).count()
        subj_monthly = subj_records.filter(timestamp__date__gte=start_of_month.date()).count()
        subj_total   = subj_records.count()

        # Total sessions conducted for this subject this month
        total_sessions = AttendanceSession.objects.filter(
            classroom=c,
            start_time__date__gte=start_of_month.date()
        ).count()

        # Percentage based on monthly sessions
        pct = round((subj_monthly / total_sessions) * 100) if total_sessions > 0 else 0

        classes.append({
            "id":   c.id,
            "name": c.name,
            "code": c.code,
            "attendance": {
                "daily":          subj_daily,
                "weekly":         subj_weekly,
                "monthly":        subj_monthly,
                "total":          subj_total,
                "total_sessions": total_sessions,
                "percentage":     pct,
            }
        })

    # Recent activity log (last 5 scans)
    recent_records = []
    for r in all_records.select_related('session__classroom').order_by('-timestamp')[:5]:
        recent_records.append({
            "id": r.id,
            "subject_name": r.session.classroom.name,
            "subject_code": r.session.classroom.code,
            "timestamp": r.timestamp.isoformat(),
            "present": r.present
        })

    return Response({
        "student": {
            "id":          student.id,
            "username":    student.user.username,
            "email":       student.user.email,
            "roll_number": student.roll_number,
            "department":  student.department,
            "classes":     classes,
        },
        "attendance": {
            "daily":   daily,
            "weekly":  weekly,
            "monthly": monthly,
            "total":   total,
        },
        "recent_records": recent_records
    })