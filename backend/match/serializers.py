from rest_framework import serializers
from accounts.models import BoardGame,BoardGameCafe,CustomUser,Designer, GameClass, GameTag
from match.models import UserGameRelation,UserFreeTime,UserCafeRelation,UserRelation,UserFreeDay
from cafes.models import Reservation,TableTimeSlot,CafeTable,ReservationTimeSlot,Participant,CafeGameRelation
from django.utils import timezone
from datetime import datetime


class BoardGameSerializer(serializers.ModelSerializer):
    # デザイナーをテキストリストとして取得
    designers = serializers.StringRelatedField(many=True)
    # ゲームカテゴリをテキストリストとして取得
    game_class = serializers.StringRelatedField(many=True)
    # ゲームメカニクスをテキストリストとして取得
    game_tags = serializers.StringRelatedField(many=True)

    class Meta:
        model = BoardGame
        fields = [
            'id', 'name', 'designers', 'min_playtime', 'max_playtime', 'min_players', 'max_players',
            'short_description', 'long_description', 'game_class', 'game_tags', 'box_image',
            'board_image', 'created_at', 'updated_at'
        ]

class UserHaveGameSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='game.id')
    name = serializers.CharField(source='game.name')
    
    class Meta:
        model = UserGameRelation
        fields = ['id', 'name']

class CafeHaveGameSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='game.id')
    name = serializers.CharField(source='game.name')
    
    class Meta:
        model = CafeGameRelation  # カフェとゲームの関連を表すモデル
        fields = ['id', 'name']


class BoardGameCafeSerializer(serializers.ModelSerializer):
    prefecture_name = serializers.CharField(source='prefecture.name', read_only=True)
    class Meta:
        model = BoardGameCafe
        fields = [
            'id', 'name', 'opening_time', 'closing_time',
            'monday_open', 'monday_close', 'tuesday_open', 'tuesday_close',
            'wednesday_open', 'wednesday_close', 'thursday_open', 'thursday_close',
            'friday_open', 'friday_close', 'saturday_open', 'saturday_close',
            'sunday_open', 'sunday_close', 'postal_code', 'prefecture_name', 'city', 
            'address', 'building', 'walking_minutes', 'image1', 'image2'
        ]


class CustomUserSerializer(serializers.ModelSerializer):
    game_class = serializers.StringRelatedField(many=True)
    profile_picture = serializers.ImageField()
    class Meta:
        model = CustomUser
        fields = ['id', 'username','game_class','profile_picture']  # 必要なフィールドを指定



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

class UserFreeDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFreeDay
        fields = ['id', 'user', 'freeday', 'daytime', 'nighttime']
        read_only_fields = ['user']

    def validate(self, data):
        daytime = data.get('daytime')
        nighttime = data.get('nighttime')

        if daytime == nighttime:
            raise serializers.ValidationError("Either daytime or nighttime must be true, but not both.")

        return data


class UserCafeRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCafeRelation
        fields = ['id', 'user', 'cafe', 'can_visit']
        read_only_fields = ['user']

class UserRelationSerializer(serializers.ModelSerializer):
    to_user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = UserRelation
        fields = ['id', 'from_user', 'to_user', 'may_follow','memo']


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
            max_participants=validated_data['numberOfPeople'],
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




class ParticipantSerializer(serializers.ModelSerializer):
    participant_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), write_only=True)  # 参加者IDを一度に一人追加
    remove_participant_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), write_only=True, required=False)  # 参加者削除用ID
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)
    participant_name = serializers.StringRelatedField(source='participant.all', many=True, read_only=True)

    # 最初のtimeslotのstart_time（lower）
    start_time = serializers.DateTimeField(source='timeslot.first.timeslot_range.lower', read_only=True)
    # 最後のtimeslotのend_time（upper）
    end_time = serializers.DateTimeField(source='timeslot.last.timeslot_range.upper', read_only=True)

    class Meta:
        model = Reservation
        fields = ['id', 'cafe','cafe_name', 'count', 'participant','participant_name', 'max_participants', 'timeslot', 'reserved_at', 'reservation_type', 'is_active', 'is_recruiting', 'game_class', 'choice_game', 'play_game', 'participant_id', 'remove_participant_id', 'start_time', 'end_time']

    def create(self, validated_data):
        # 参加者追加処理
        participant_id = validated_data.pop('participant_id', None)
        reservation = super().create(validated_data)
        if participant_id:
            Participant.objects.create(reservation=reservation, user_id=participant_id)  # 参加者を予約に追加
        return reservation

    def update(self, instance, validated_data):
        # 参加者削除処理
        participant_id_to_remove = validated_data.pop('remove_participant_id', None)
        
        reservation = super().update(instance, validated_data)
        
        if participant_id_to_remove:
            try:
                # 参加者を削除
                participant = Participant.objects.get(reservation=reservation, user_id=participant_id_to_remove)
                participant.delete()  # 参加者を削除
            except Participant.DoesNotExist:
                raise serializers.ValidationError("指定された参加者はこの予約に参加していません。")
        
        return reservation
