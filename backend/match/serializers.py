from rest_framework import serializers
from accounts.models import BoardGame
from match.models import UserGameRelation,UserFreeTime

class BoardGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardGame
        fields = ['id', 'name']

class UserGameRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGameRelation
        #fields = ['id','game','want_to_play']
        fields = ['id', 'user', 'game', 'want_to_play']
        read_only_fields = ['user']

class UserFreeTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFreeTime
        fields = ['id','user','monday','tuesday','wednesday','thursday','friday','saturday','sunday']
        read_only_fields = ['user']