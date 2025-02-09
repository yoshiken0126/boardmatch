from rest_framework import serializers
from .models import CafeTable
from accounts.models import BoardGameCafe

class CafeTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafeTable
        fields = ['id', 'table_name', 'capacity']

class BoardGameCafeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardGameCafe
        fields = '__all__'  # 全てのフィールドをシリアライズする







#試しで作ります。ダメなら全消去で。
from rest_framework import serializers
from django.utils import timezone
from .models import Reservation, TableTimeSlot, ReservationTimeSlot, Participant

from rest_framework import serializers
from cafes.models import Reservation, TableTimeSlot


class ParticipantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # ここでCustomUserの情報を取得する

    class Meta:
        model = Participant
        fields = ['user']


class ReservationSerializer(serializers.ModelSerializer):
    # 最初のtimeslotのstart_time
    start_time = serializers.DateTimeField(source='timeslot.first.timeslot_range.lower', read_only=True)
    # 最後のtimeslotのend_time
    end_time = serializers.DateTimeField(source='timeslot.last.timeslot_range.upper', read_only=True)

    participants = ParticipantSerializer(source='user_relations', many=True, read_only=True)

    class Meta:
        model = Reservation
        fields = ['cafe', 'table','count', 'reserved_at', 'reservation_type', 'start_time', 'end_time', 'participants']



