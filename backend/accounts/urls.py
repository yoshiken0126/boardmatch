from accounts.views import SignUpView,CafeSignUpView
from django.urls import path
from . import views
from .views import CustomLoginView,CustomLogoutView,BoardGameCafeCreateView,BoardGameCreateView,CustomUserSignup,UserInfoView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView,TokenVerifyView

app_name = 'accounts'
urlpatterns = [
    path('signup/',SignUpView.as_view(),name="signup"),
    path('cafe_signup/',CafeSignUpView.as_view(),name="cafe_signup"),
    path('logout/',CustomLogoutView.as_view(),name="logout"),
    path('', CustomLoginView.as_view(), name='login'),
    path('add_cafe/',BoardGameCafeCreateView.as_view(),name='add_cafe'),
    path('add_game/',BoardGameCreateView.as_view(),name='add_game'),

    path('api/signup/', CustomUserSignup.as_view(), name='user_signup'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),#ここでユーザー名とパスワードを送信してそれぞれのトークンを発行します。いわゆるログインです。
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),#ここではリフレッシュトークンを利用してアクセストークンを発行します。
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('user-info/', UserInfoView.as_view(), name='user_info'),
]