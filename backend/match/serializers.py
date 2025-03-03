from rest_framework import serializers
from accounts.models import BoardGame,BoardGameCafe,CustomUser,Designer, GameClass, GameTag
from match.models import UserGameRelation,UserFreeTime,UserCafeRelation,UserRelation,UserFreeDay
from cafes.models import Reservation,TableTimeSlot,CafeTable,ReservationTimeSlot,Participant,CafeGameRelation,PlayGame
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
    
    personal_games = serializers.PrimaryKeyRelatedField(queryset=BoardGame.objects.all(), many=True, required=False)
    cafe_games = serializers.PrimaryKeyRelatedField(queryset=BoardGame.objects.all(), many=True, required=False)

    class Meta:
        model = Reservation
        fields = ['cafe', 'table', 'timeslot', 'participant', 'date', 'course', 'startTime', 'endTime', 'numberOfPeople','max_participants','personal_games','cafe_games']


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

        personal_games = validated_data.get('personal_games', [])
        print(personal_games)
        cafe_games = validated_data.get('cafe_games', [])
        print(cafe_games)
        
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
            max_participants=validated_data['max_participants'],
            reserved_at=timezone.now(),
            reservation_type=reservation_type,
            game_class=validated_data['game_class'] if validated_data.get('game_class') else None
        )


        selected_games = validated_data.get('cafe_games', []) + validated_data.get('personal_games', [])

        if user.user_type == 'custom_user':
            customuser = CustomUser.objects.get(id=user.id)
    
        for game in selected_games:
            PlayGame.objects.create(
                reservation=reservation,
                game=game,
                game_provider_type='cafe' if game in validated_data['cafe_games'] else 'user',
                provider = customuser if game in validated_data['personal_games'] else None,
                instructor = customuser if game in validated_data['personal_games'] else None
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
    # 参加者ID: 予約に参加するユーザーID
    participant_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), write_only=True)  
    # 参加者削除用ID: 既存の参加者を削除するためのID
    remove_participant_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), write_only=True, required=False)  
    # カフェの名前
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)
    # 参加者名を取得
    participant_name = serializers.StringRelatedField(source='participant.all', many=True, read_only=True)

    # 最初のtimeslotのstart_time（lower）
    start_time = serializers.DateTimeField(source='timeslot.first.timeslot_range.lower', read_only=True)
    # 最後のtimeslotのend_time（upper）
    end_time = serializers.DateTimeField(source='timeslot.last.timeslot_range.upper', read_only=True)

    # 新しく追加: カフェが提供するゲームリスト
    cafe_games = serializers.SerializerMethodField()
    # 新しく追加: ユーザーが持ち込むゲームリスト
    user_games = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'cafe', 'cafe_name', 'count', 'participant', 'participant_name', 
            'max_participants', 'timeslot', 'reserved_at', 'reservation_type', 
            'is_active', 'is_recruiting', 'game_class', 'choice_game', 
            'participant_id', 'remove_participant_id', 'start_time', 'end_time', 
            'cafe_games', 'user_games'
        ]

    def get_cafe_games(self, obj):
        """カフェが提供するゲーム情報"""
        games = PlayGame.objects.filter(reservation=obj, game_provider_type='cafe')
        return [
            {
                'game_id': pg.game.id,
                'name': pg.game.name,
                'play_game_id': pg.id,
                'instructor_id': pg.instructor.id if pg.instructor else None,
                'instructor_name': pg.instructor.get_full_name() if pg.instructor else None
            }
            for pg in games.select_related('game', 'instructor')
        ]

    def get_user_games(self, obj):
        """ユーザーが持ち込むゲーム情報"""
        games = PlayGame.objects.filter(reservation=obj, game_provider_type='user')
        return [
            {
                'game_id': pg.game.id,
                'name': pg.game.name,
                'play_game_id': pg.id,
                'provider_id': pg.provider.id if pg.provider else None,
                'provider_name': pg.provider.get_full_name() if pg.provider else None,
                'instructor_id': pg.instructor.id if pg.instructor else None,
                'instructor_name': pg.instructor.get_full_name() if pg.instructor else None
            }
            for pg in games.select_related('game', 'provider', 'instructor')
        ]

    def create(self, validated_data):
        """新規予約の作成。参加者を追加する"""
        participant_id = validated_data.pop('participant_id', None)
        reservation = super().create(validated_data)
        
        # 参加者IDが存在する場合、予約に参加者を追加する
        if participant_id:
            # 参加者が既に存在するかをチェックしてから追加
            if not Participant.objects.filter(reservation=reservation, user_id=participant_id).exists():
                Participant.objects.create(reservation=reservation, user_id=participant_id)
            else:
                raise serializers.ValidationError("この参加者はすでにこの予約に追加されています。")
        
        return reservation

    def update(self, instance, validated_data):
        """既存予約の更新。参加者を削除する"""
        participant_id_to_remove = validated_data.pop('remove_participant_id', None)
        
        reservation = super().update(instance, validated_data)

        if participant_id_to_remove:
            try:
                # 指定された参加者がこの予約に存在するか確認し、存在する場合削除
                participant = Participant.objects.get(reservation=reservation, user_id=participant_id_to_remove)
                participant.delete()
            except Participant.DoesNotExist:
                raise serializers.ValidationError("指定された参加者はこの予約に参加していません。")
        
        return reservation
