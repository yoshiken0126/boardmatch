from accounts.views import SignUpView,CafeSignUpView
from django.urls import path
from . import views
from .views import CustomLoginView,CustomLogoutView,BoardGameCafeCreateView,BoardGameCreateView,CustomUserSignup


app_name = 'accounts'
urlpatterns = [
    path('signup/',SignUpView.as_view(),name="signup"),
    path('cafe_signup/',CafeSignUpView.as_view(),name="cafe_signup"),
    path('logout/',CustomLogoutView.as_view(),name="logout"),
    path('', CustomLoginView.as_view(), name='login'),
    path('add_cafe/',BoardGameCafeCreateView.as_view(),name='add_cafe'),
    path('add_game/',BoardGameCreateView.as_view(),name='add_game'),

    path('api/signup/', CustomUserSignup.as_view(), name='user_signup'),
]