
from django.urls import path,include
from . import views
from rest_framework.routers import DefaultRouter
from .views import UserGameRelationViewSet,UserCafeRelationViewSet,UserFreeTimeViewSet,UserRelationViewSet,UserInfoViewSet,ReservationViewSet,BoardGameViewSet,ParticipantViewSet,UserFreeDayViewSet,UserHaveGameViewSet,CafeHaveGameViewSet,UserGameClassViewSet


router = DefaultRouter()
router.register(r'user_game_relations', UserGameRelationViewSet,basename='user_game_relation')
router.register(r'user_cafe_relations', UserCafeRelationViewSet,basename='user_cafe_relation')
router.register(r'user_freetimes', UserFreeTimeViewSet, basename='user_freetime')
router.register(r'user_relations', UserRelationViewSet, basename='user_relation')
router.register(r'user_info', UserInfoViewSet, basename='user_info')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'boardgames', BoardGameViewSet)
router.register(r'participants', ParticipantViewSet, basename='participant')
router.register(r'user_freedays', UserFreeDayViewSet,basename='user_freeday')
router.register(r'user_have_games/(?P<game_class>[^/]+)', UserHaveGameViewSet, basename='user_have_game')
router.register(r'cafe_have_games/(?P<cafe_id>\d+)/(?P<player_class>[^/]+)', CafeHaveGameViewSet, basename='cafe_have_game')
router.register(r'user_game_class', UserGameClassViewSet, basename='user')


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

    path('api/cafe_list/',views.BoardGameCafeList.as_view(),name='cafe_list'),
    path('api/', include(router.urls)),

]

