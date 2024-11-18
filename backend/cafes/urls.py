from django.urls import path
from . import views



app_name = 'cafes'
urlpatterns = [
    path('otamesi/',views.otamesi,name='otamesi'),
    path('register_boardgame/',views.register_boardgame,name='register_boardgame'),
    path('staff_can_instruct/',views.staff_can_instruct,name='staff_can_instruct'),
    path('show_cafe_schedule/',views.show_cafe_schedule,name='show_cafe_schedule'),
]