from rest_framework import serializers
from .models import CafeTable
from accounts.models import BoardGameCafe,CustomUser,CafeStaff,BoardGame

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
from cafes.models import Reservation, TableTimeSlot,Message


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
    table = serializers.SerializerMethodField()

    # カフェ名を取得するためのフィールドを追加
    cafe_name = serializers.SerializerMethodField()

    def get_table(self, obj):
        # timeslotに紐づくすべてのテーブルのIDをユニークに取得
        tables = obj.timeslot.all().values_list('table__id', flat=True)
        # 重複を取り除いてリストに変換
        unique_tables = list(set(tables))
        return unique_tables

    def get_cafe_name(self, obj):
        # カフェの名前を取得（カフェが存在する場合）
        return obj.cafe.name if obj.cafe else None

    def to_representation(self, instance):
        # ユーザータイプを取得
        user = self.context['request'].user  # リクエストから現在のユーザーを取得
        user_type = user.user_type  # ユーザータイプを取得

        # スタッフユーザーの場合は全ての予約情報をそのまま返す
        if user_type == 'staff_user':
            return super().to_representation(instance)

        if user_type == 'custom_user':
        # カスタムユーザーの参加している予約かつ is_active=True の条件でフィルタリング
            if instance.user_relations.filter(user=user, reservation__is_active=True).exists():
                return super().to_representation(instance)
            return {}  # 条件に合わない場合は空の辞書を返す

            # デフォルトの返却（必要なら他のユーザータイプにも対応）
        return super().to_representation(instance)

    
    class Meta:
        model = Reservation
        fields = ['id', 'cafe', 'cafe_name', 'table', 'count', 'reserved_at', 'reservation_type', 'start_time', 'end_time', 'participants','max_participants', 'is_active','is_recruiting','game_class','choice_game','play_game']
    


from .models import Message, SuggestGame, SuggestGameInstructor,SuggestGameProvider,SuggestGameParticipant,CafeGameRelation
from match.serializers import BoardGameSerializer
from match.models import UserGameRelation


class SuggestGameInstructorSerializer(serializers.ModelSerializer):
    # `instructor`の`username`を文字列として取得する
    instructor = serializers.StringRelatedField()  # `instructor`の`__str__`を使用
    is_accepted = serializers.BooleanField()  # `is_accepted`フィールドを追加
    suggest_game = serializers.PrimaryKeyRelatedField(queryset=SuggestGame.objects.all(), write_only=True)  # POST専用のゲームID
    user_id = serializers.SerializerMethodField()  # `user_id`をシリアライズするためのフィールド

    class Meta:
        model = SuggestGameInstructor
        fields = ['id', 'instructor', 'is_accepted', 'suggest_game', 'user_id']

    def get_user_id(self, obj):
        """
        `instructor` から `user_id` を取得して返す
        """
        if hasattr(obj, 'instructor') and obj.instructor:
            return obj.instructor.id
        return None

    def update(self, instance, validated_data):
        # is_acceptedフィールドの値を取得
        is_accepted = validated_data.get('is_accepted', instance.is_accepted)
        
        # インスタンスを更新
        instance.is_accepted = is_accepted
        instance.save()
        
        return instance
    
class SuggestGameProviderSerializer(serializers.ModelSerializer):
    provider = serializers.StringRelatedField()

    class Meta:
        model = SuggestGameProvider
        fields = ['id','provider']

class SuggestGameParticipantSerializer(serializers.ModelSerializer):
    # `participant`の`username`を文字列として取得する
    participant = serializers.StringRelatedField()  # `participant`の`__str__`を使用
    is_accepted = serializers.BooleanField()
    suggest_game = serializers.PrimaryKeyRelatedField(queryset=SuggestGame.objects.all(), write_only=True)  # POST専用のゲームID
    user_id = serializers.SerializerMethodField()  # user_idをシリアライズするためのフィールド

    class Meta:
        model = SuggestGameParticipant
        fields = ['id','participant', 'is_accepted','suggest_game','user_id']

    def get_user_id(self, obj):
        """
        `participant` から `user_id` を取得して返す
        """
        if hasattr(obj, 'participant') and obj.participant:
            return obj.participant.id
        return None

    def create(self, validated_data):
        """
        POSTリクエストを受けて、`is_accepted`の情報と
        POSTしたユーザーのインスタンスを作成
        """
        # 現在認証されたユーザーを取得
        user = self.context['request'].user
        customuser = CustomUser.objects.get(id=user.id)
        suggest_game = validated_data.get('suggest_game')
        is_accepted = validated_data.get('is_accepted', False)

        # SuggestGameParticipantの新しいインスタンスを作成
        participant_instance = SuggestGameParticipant.objects.create(
            participant=customuser,
            suggest_game=suggest_game,
            is_accepted=is_accepted
        )

        return participant_instance

class SuggestGameSerializer(serializers.ModelSerializer):
    suggest_game = serializers.SerializerMethodField()# 提案されたゲーム名
    participants = SuggestGameParticipantSerializer(source='suggestgameparticipant_set', many=True,required=False)  # 承認した参加者
    instructors = SuggestGameInstructorSerializer(source='suggestgameinstructor_set', many=True,required=False)  # 明示的に関連名を指定
    providers = SuggestGameProviderSerializer(source='suggestgameprovider_set', many=True,required=False)  # 明示的に関連名を指定
    reservation = serializers.PrimaryKeyRelatedField(queryset=Reservation.objects.all(),write_only=True)  # ReservationのIDを受け取る
    game = serializers.PrimaryKeyRelatedField(queryset=BoardGame.objects.all(),write_only=True)  # GameのIDを受け取る

    class Meta:
        model = SuggestGame
        fields = ['id','suggest_game', 'participants', 'instructors','providers', 'count_want_to_play','is_approved','reservation','game']

    def get_suggest_game(self, obj):
        """
        提案されたボードゲームの詳細情報を取得
        """
        if obj.suggest_game:
            # BoardGameのシリアライザを使用してゲームの詳細情報を取得
            return BoardGameSerializer(obj.suggest_game).data
        return None

    



class MessageSerializer(serializers.ModelSerializer):
    reservation = serializers.StringRelatedField()  # 予約の情報（文字列表示）
    sender = serializers.StringRelatedField()  # メッセージ送信者
    content = serializers.CharField()  # メッセージ内容
    sent_at = serializers.DateTimeField()  # メッセージ送信日時
    is_user_sender = serializers.SerializerMethodField()  # ログイン中のユーザーが送信者かどうか判定
    sender_profile_picture = serializers.SerializerMethodField()  # 送信者のプロフィール画像
    suggest_game = serializers.SerializerMethodField()  # ゲーム提案の情報（関連があれば）
    related_suggest_game = SuggestGameSerializer()

    class Meta:
        model = Message
        fields = ['reservation', 'sender','is_public','is_system_message','is_rule_approval','is_suggest', 'content', 'sent_at', 'is_user_sender', 'sender_profile_picture', 'suggest_game','receiver','related_suggest_game']

    def get_is_user_sender(self, obj):
        """
        ログイン中のユーザーがメッセージ送信者かを判定する
        """
        user = self.context.get('request').user  # request.userでログインユーザーを取得
        return obj.sender == user  # メッセージの送信者がログインユーザーかどうかを確認

    def get_sender_profile_picture(self, obj):
        """
        メッセージ送信者のプロフィール画像URLを取得する
        BaseUser（親クラス）の場合はCustomUserにキャストしてアクセス
        """

        sender = obj.sender

        if sender is None:  # senderがNoneの場合
            return None  # または、デフォルト画像のURLを返すことも可能

        customuser = CustomUser.objects.get(username=sender)
    
        # sender が BaseUser のインスタンスの場合、CustomUser にキャストして profile_picture を取得
        if isinstance(customuser, CustomUser):
            return customuser.profile_picture.url if customuser.profile_picture else None
    
        return None

    

    def get_suggest_game(self, obj):
        """
        メッセージに関連するゲーム提案を取得
        """
        if obj.is_suggest:
            suggest_game = obj.get_game_suggest()  # SuggestGame を取得するメソッド
            if suggest_game:
                return SuggestGameSerializer(suggest_game).data
        return None



class CafeHaveSuggestGameSerializer(serializers.Serializer):
    game = BoardGameSerializer()  # game フィールドを BoardGameSerializer でシリアライズ
    want_to_play_count = serializers.IntegerField()

    class Meta:
        model = CafeGameRelation
        fields = ['game', 'want_to_play_count']

class UserHaveSuggestGameSerializer(serializers.Serializer):
    game = BoardGameSerializer()  # game フィールドを BoardGameSerializer でシリアライズ
    want_to_play_count = serializers.IntegerField()  # プレイしたい回数

    class Meta:
        model = UserGameRelation
        fields = ['game', 'want_to_play_count']


