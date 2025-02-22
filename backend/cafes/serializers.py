from rest_framework import serializers
from .models import CafeTable
from accounts.models import BoardGameCafe,CustomUser

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
        fields = ['id', 'cafe', 'cafe_name', 'table', 'count', 'reserved_at', 'reservation_type', 'start_time', 'end_time', 'participants', 'is_active']
    

class MessageSerializer(serializers.ModelSerializer):
    reservation = serializers.StringRelatedField()  # 予約の情報（文字列表示）
    sender = serializers.StringRelatedField()  # メッセージ送信者
    content = serializers.CharField()  # メッセージ内容
    sent_at = serializers.DateTimeField()  # メッセージ送信日時
    is_user_sender = serializers.SerializerMethodField()  # ログイン中のユーザーが送信者かどうか判定
    sender_profile_picture = serializers.SerializerMethodField()  # 送信者のプロフィール画像

    class Meta:
        model = Message
        fields = ['reservation', 'sender', 'content', 'sent_at', 'is_user_sender', 'sender_profile_picture']

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
        customuser = CustomUser.objects.get(username=sender)
    
    # sender が BaseUser のインスタンスの場合、CustomUser にキャストして profile_picture を取得
        if isinstance(customuser, CustomUser):
            return customuser.profile_picture.url if customuser.profile_picture else None
    
        return None





