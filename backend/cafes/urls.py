from django.urls import path,include
from . import views
from rest_framework.routers import DefaultRouter
from .views import CafeTableViewSet,StaffInfoViewSet
from .views import BoardGameCafeViewSet,ReservationViewSet,MessageViewSet,SuggestGameParticipantViewSet,SuggestGameInstructorViewSet,CafeHaveSuggestGameViewSet,UserHaveSuggestGameViewSet,SuggestGameViewSet


router = DefaultRouter()
router.register(r'tables', CafeTableViewSet, basename='cafetable')
router.register(r'staff_info', StaffInfoViewSet, basename='staff_info')
router.register(r'boardgamecafes', BoardGameCafeViewSet,basename='boardgamecafe')
router.register(r'reservations', ReservationViewSet,basename='reservation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'suggest_game_participants', SuggestGameParticipantViewSet)
router.register(r'suggest_game_instructors', SuggestGameInstructorViewSet)
router.register(r'cafe_have_suggest_games/(?P<id>\d+)/(?P<class_param>[^/]+)', CafeHaveSuggestGameViewSet, basename='cafe-game')
router.register(r'user_have_suggest_games/(?P<id>\d+)/(?P<class_param>[^/]+)', UserHaveSuggestGameViewSet, basename='user-game')
router.register(r'suggest_games', SuggestGameViewSet) 

app_name = 'cafes'
urlpatterns = [
    path('otamesi/',views.otamesi,name='otamesi'),
    path('register_boardgame/',views.register_boardgame,name='register_boardgame'),
    path('staff_can_instruct/',views.staff_can_instruct,name='staff_can_instruct'),
    path('show_cafe_schedule/',views.show_cafe_schedule,name='show_cafe_schedule'),

    path('api/', include(router.urls)),
]