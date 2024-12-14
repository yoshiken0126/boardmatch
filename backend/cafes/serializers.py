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

class TableTimeSlotSerializer(serializers.ModelSerializer):
    # timeslot_range をローカルタイムに変換してから表示
    timeslot_range = serializers.SerializerMethodField()

    class Meta:
        model = TableTimeSlot
        fields = ['id', 'timeslot_range', 'is_reserved', 'is_closed']

    def get_timeslot_range(self, obj):
        # タイムゾーンをローカルタイム（例: Asia/Tokyo）に変換
        start_time = timezone.localtime(obj.timeslot_range.lower) if obj.timeslot_range.lower else None
        end_time = timezone.localtime(obj.timeslot_range.upper) if obj.timeslot_range.upper else None
        
        # タイムスタンプがある場合は文字列に変換して返す
        return {
            "start": start_time.strftime('%Y-%m-%dT%H:%M:%S%z') if start_time else None,
            "end": end_time.strftime('%Y-%m-%dT%H:%M:%S%z') if end_time else None
        }

class ReservationTimeSlotSerializer(serializers.ModelSerializer):
    timeslot = TableTimeSlotSerializer(read_only=True)  # timeslotを読み取り専用に設定

    class Meta:
        model = ReservationTimeSlot
        fields = ['timeslot']

class ReservationSerializer(serializers.ModelSerializer):
    reservation_timeslots = ReservationTimeSlotSerializer(source='timeslot_relations', many=True, read_only=True)  # timeslot_relationsのデータを取得し、読み取り専用に設定

    class Meta:
        model = Reservation
        fields = ['id', 'cafe', 'table', 'reserved_at', 'reservation_type', 'reservation_timeslots']


