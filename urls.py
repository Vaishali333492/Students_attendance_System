from django.urls import path
from . import views

urlpatterns = [
    path('classrooms/', views.classroom_list, name='classroom-list'),
    path('session/', views.generate_qr_token, name='generate-qr-token'),
    path('scan/', views.scan_attendance, name='scan-attendance'),
]
