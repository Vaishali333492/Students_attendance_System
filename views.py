from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer


@api_view(['POST'])
def register(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

        return Response(
            {
                "message": "Registration Successful"
            },
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login(request):

    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:

        refresh = RefreshToken.for_user(user)

        return Response({

            "message": "Login Successful",

            "access": str(refresh.access_token),

            "refresh": str(refresh),

            "username": user.username,

            "role": user.role,

            "user_id": user.id

        })

    return Response(
        {
            "message": "Invalid Username or Password"
        },
        status=status.HTTP_401_UNAUTHORIZED
    )