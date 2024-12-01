from rest_framework import serializers
from accounts.models import BoardGame,BoardGameCafe,CustomUser
from match.models import UserGameRelation,UserFreeTime,UserCafeRelation,UserRelation

class BoardGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardGame
        fields = ['id', 'name']

class BoardGameCafeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardGameCafe
        fields = ['id', 'name']

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username']  # 必要なフィールドを指定



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

class UserCafeRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCafeRelation
        fields = ['id', 'user', 'cafe', 'can_visit']
        read_only_fields = ['user']

class UserRelationSerializer(serializers.ModelSerializer):
    to_user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = UserRelation
        fields = ['id', 'from_user', 'to_user', 'may_follow']