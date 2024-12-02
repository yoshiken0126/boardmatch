from accounts.models import CustomUser,BoardGameCafe,BoardGame
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import generic
from django.views.generic import TemplateView,CreateView
from .forms import CustomUserCreationForm,CafeStaffCreationForm,BoardGameCafeForm,BoardGameForm
from django.contrib.auth.views import LoginView,LogoutView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import CustomUserSerializer
from rest_framework.permissions import IsAuthenticated


class CustomUserSignup(APIView):
    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "ユーザー登録が完了しました"}, status=status.HTTP_201_CREATED)#post成功時のレスポンス
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)#エラー時のレスポンス

class UserInfoView(APIView): #追記
    permission_classes = [IsAuthenticated] #ログイン中のユーザーのみアクセス可能とする

    def get(self, request):
        serializer = CustomUserSerializer(request.user) 
        return Response(serializer.data) #getメソッドでユーザーの情報を取得














# Create your views here.
class SignUpView(generic.CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('accounts:login')#アカウント作成後、ログイン画面に飛ぶ
    template_name = 'accounts/signup.html'

class CafeSignUpView(generic.CreateView):
    form_class = CafeStaffCreationForm
    success_url = reverse_lazy('accounts:login')#アカウント作成後、ログイン画面に飛ぶ
    template_name = 'accounts/signup.html'

class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True #ログイン済みユーザーはリダイレクトされる
    def get_success_url(self): #ログイン後にホームページへ移る
        return reverse_lazy('match:frontpage')

class CustomLogoutView(LogoutView):
    next_page = reverse_lazy('accounts:login')


class BoardGameCafeCreateView(CreateView):
    model = BoardGameCafe
    form_class = BoardGameCafeForm
    template_name = 'accounts/add_cafe.html'
    success_url = reverse_lazy('match:frontpage') # 成功時のリダイレクト先

class BoardGameCreateView(CreateView):
    model = BoardGame
    form_class = BoardGameForm
    template_name = 'accounts/add_game.html'
    success_url = reverse_lazy('match:frontpage') # 成功時のリダイレクト先

