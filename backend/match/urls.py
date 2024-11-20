
from django.urls import path
from . import views


app_name = 'match'
urlpatterns = [
    path('frontpage/',views.show_frontpage,name='frontpage'),
    path('can_visit_cafe/', views.can_visit_cafe, name='can_visit_cafe'),
    path('can_visit_time/', views.can_visit_time, name='can_visit_time'),
    path('user_can_instruct/', views.user_can_instruct, name='user_can_instruct'),
    path('user_want_to_play/', views.user_want_to_play, name='user_want_to_play'),
    path('user_may_follow/', views.user_may_follow, name='user_may_follow'),
    path('user_must_follow/', views.user_must_follow, name='user_must_follow'),
    path('optimize/',views.try_optimize,name='optimize'),

    path('api/',views.BoardGameListCreate.as_view(),name='boardgame_list'),
    

]