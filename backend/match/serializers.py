from rest_framework import serializers
from accounts.models import BoardGame #Salonモデルをインポート

class BoardGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardGame
        fields = ['id', 'name']