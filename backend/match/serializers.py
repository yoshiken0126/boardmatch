from rest_framework import serializers
from accounts.models import BoardGame,BoardGameCafe,CustomUser
from match.models import UserGameRelation,UserFreeTime,UserCafeRelation,UserRelation
from cafes.models import Reservation,TableTimeSlot,CafeTable,ReservationTimeSlot,Participant
from django.utils import timezone
from datetime import datetime

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
        fields = ['id','user','monday_daytime', 'monday_nighttime',
                         'tuesday_daytime', 'tuesday_nighttime',
                         'wednesday_daytime', 'wednesday_nighttime', 
                         'thursday_daytime', 'thursday_nighttime', 
                         'friday_daytime', 'friday_nighttime', 
                         'saturday_daytime', 'saturday_nighttime', 
                         'sunday_daytime', 'sunday_nighttime']
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


class ReservationSerializer(serializers.ModelSerializer):
    cafe = serializers.PrimaryKeyRelatedField(queryset=BoardGameCafe.objects.all())
    table = serializers.PrimaryKeyRelatedField(queryset=CafeTable.objects.all(),required=False)
    timeslot = serializers.PrimaryKeyRelatedField(queryset=TableTimeSlot.objects.all(), many=True,required=False)
    participant = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), many=True,required=False)

    # date, course, startTime, endTime から timeslot を関連付ける処理を行う
    date = serializers.DateField(write_only=True)
    course = serializers.CharField(max_length=20,write_only=True)
    startTime = serializers.TimeField(write_only=True)
    endTime = serializers.TimeField(write_only=True)
    numberOfPeople = serializers.IntegerField(write_only=True)

    class Meta:
        model = Reservation
        fields = ['cafe', 'table', 'timeslot', 'participant', 'date', 'course', 'startTime', 'endTime', 'numberOfPeople']


    def get_available_table_ids_for_slot(self, cafe_id, start_time, end_time, count):
        # 指定されたカフェIDに関連するテーブルを取得
        cafe_tables = CafeTable.objects.filter(cafe_id=cafe_id)
        
        # 指定された時間帯に重なる TableTimeSlot を取得
        timeslots = TableTimeSlot.objects.filter(
            timeslot_range__overlap=(start_time, end_time)
        )
        
        available_tables = []
        for table in cafe_tables:
            table_timeslots = timeslots.filter(table=table)
            all_available = True
            for slot in table_timeslots:
                if slot.is_reserved or slot.is_closed:
                    all_available = False
                    break
            if all_available:
                available_tables.append(table)
        
        # 予約人数に対応するため、必要なテーブルを返す
        available_tables_for_reservation = []
        remaining_count = count
        for table in available_tables:
            if remaining_count <= 0:
                break
            if table.capacity <= remaining_count:
                available_tables_for_reservation.append(table)
                remaining_count -= table.capacity
            else:
                available_tables_for_reservation.append(table)
                remaining_count = 0
        
        if remaining_count > 0:
            # まだ人数が足りていない場合は空きテーブルが足りない
            return []
            
        return available_tables_for_reservation


    def create(self, validated_data):
        cafe = validated_data['cafe']
        count = validated_data['numberOfPeople']
        
        # 予約が空いているテーブルを選ぶロジック
        # dateとcourseを使用して時間帯を特定
        date = validated_data.get('date')
        course = validated_data.get('course')
        start_time = validated_data.get('startTime')
        end_time = validated_data.get('endTime')
        
        start_time = datetime.strptime(
            f"{date} {start_time}",
            '%Y-%m-%d %H:%M:%S'
        )
        end_time = datetime.strptime(
            f"{date} {end_time}",
            '%Y-%m-%d %H:%M:%S'
        )
        
        start_time = timezone.make_aware(start_time)
        end_time = timezone.make_aware(end_time)
        
        available_tables = self.get_available_table_ids_for_slot(
            cafe,
            start_time,
            end_time,
            count
        )
        
        if not available_tables:
            raise serializers.ValidationError('空いているテーブルが見つかりません')
        
        # ユーザー情報の取得
        user = self.context['request'].user
        reservation_type = 'staff' if user.user_type == 'staff_user' else 'user'
        
        # 予約の作成
        reservation = Reservation.objects.create(
            cafe=cafe,
            count=validated_data['numberOfPeople'],
            reserved_at=timezone.now(),
            reservation_type=reservation_type
        )
        
        # 複数のテーブルに対して予約を行う
        for table in available_tables:
            # 対応する時間帯を更新
            timeslots = TableTimeSlot.objects.filter(
                table=table,
                timeslot_range__overlap=(start_time, end_time)
            )
            timeslots.update(is_reserved=True)
            
            for timeslot in timeslots:
                ReservationTimeSlot.objects.create(
                    reservation=reservation,
                    timeslot=timeslot
                )
        
        # 参加者の登録（必要に応じて）
        if user.user_type == 'custom_user':
            user = CustomUser.objects.get(id=user.id)
            participant = Participant.objects.create(
                reservation=reservation,
                user=user
            )
        
        return reservation