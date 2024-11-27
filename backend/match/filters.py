import django_filters
from .models import UserGameRelation

class UserGameRelationFilter(django_filters.FilterSet):
    game_id = django_filters.NumberFilter(field_name='game__id')  # game_id でフィルタリング
    user_id = django_filters.NumberFilter(field_name='user__id')  # user_id でフィルタリング

    class Meta:
        model = UserGameRelation
        fields = ['game_id', 'user_id']
