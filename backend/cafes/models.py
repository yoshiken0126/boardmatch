from django.db import models
from django.contrib.postgres.fields import DateTimeRangeField
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Count


# Create your models here.
class CafeGameRelation(models.Model):
    cafe = models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE,related_name='game_relations')
    game = models.ForeignKey('accounts.BoardGame',on_delete=models.CASCADE,related_name='cafe_relations')
    can_instruct = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)

    class Meta:
        unique_together = ('cafe', 'game')

class StaffGameRelation(models.Model):
    staff = models.ForeignKey('accounts.CafeStaff',on_delete=models.CASCADE,related_name='game_relations')
    game = models.ForeignKey('accounts.BoardGame',on_delete=models.CASCADE,related_name='staff_relations')
    can_instruct = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)

    class Meta:
        unique_together = ('staff', 'game')


class CafeTable(models.Model):
    cafe = models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE,related_name="table_relations",)
    table_name = models.CharField(max_length=10)
    capacity = models.PositiveIntegerField(default=4)


    def __str__(self):
        """
        テーブルの文字列表現
        """
        return f"{self.table_name} (Capacity: {self.capacity})"





    def __str__(self):
        return self.table_name

    def create_weekly_timeslots(self):
        # カフェテーブルが作成された日時
        created_at = self.created_at if hasattr(self, 'created_at') else timezone.now()

        # その週の月曜日を計算
        start_of_week = created_at - timedelta(days=created_at.weekday())

        # デフォルトの営業時間を取得
        default_opening = self.cafe.opening_time
        default_closing = self.cafe.closing_time

        # 曜日の対応表
        weekday_names = {
            0: 'monday',
            1: 'tuesday',
            2: 'wednesday',
            3: 'thursday',
            4: 'friday',
            5: 'saturday',
            6: 'sunday'
        }

        # 1週間ごとのタイムスロットを5週間分作成
        for week_offset in range(5):
            for day_offset in range(7):
                day_start = start_of_week + timedelta(weeks=week_offset, days=day_offset)
                weekday_name = weekday_names[day_start.weekday()]
                
                # その曜日の営業時間を取得
                day_opening = getattr(self.cafe, f"{weekday_name}_open")
                day_closing = getattr(self.cafe, f"{weekday_name}_close")

                # デフォルトの時間帯でタイムスロットを作成
                current_time = timezone.make_aware(datetime.combine(day_start, default_opening))
                end_time = timezone.make_aware(datetime.combine(day_start, default_closing))

                while current_time < end_time:
                    next_time = current_time + timedelta(minutes=60)
                    if next_time > end_time:
                        next_time = end_time

                    # タイムスロットが営業時間内かどうかを判定
                    is_closed = True  # デフォルトは閉店状態

                    if day_opening is not None and day_closing is not None:
                        # 営業日の場合、時間帯をチェック
                        slot_time = current_time.time()
                        if day_opening <= slot_time < day_closing:
                            is_closed = False

                    # タイムスロットを作成
                    TableTimeSlot.objects.create(
                        table=self,
                        timeslot_range=(current_time, next_time),
                        is_closed=is_closed
                    )
                    
                    current_time = next_time




class TableTimeSlot(models.Model):
    table = models.ForeignKey('cafes.CafeTable', on_delete=models.CASCADE, related_name='timeslot_relations')
    timeslot_range = DateTimeRangeField(null=True)  # start_time と end_time を範囲型で表現
    is_reserved = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)

    

    def __str__(self):
        # タイムゾーンをローカルタイム（例: Asia/Tokyo）に変換
        start_time = timezone.localtime(self.timeslot_range.lower) if self.timeslot_range.lower else None
        end_time = timezone.localtime(self.timeslot_range.upper) if self.timeslot_range.upper else None
        
        # ローカルタイムでフォーマットした開始時刻と終了時刻を表示
        start_time_str = start_time.strftime('%Y-%m-%d %H:%M:%S') if start_time else 'N/A'
        end_time_str = end_time.strftime('%Y-%m-%d %H:%M:%S') if end_time else 'N/A'
        
        # テーブルIDを取得
        table_id = self.table.id if self.table else 'Unknown Table ID'
        
        return f"TableTimeSlot for Table ID {table_id} - {start_time_str} to {end_time_str} ({'Reserved' if self.is_reserved else 'Available'})"
        
    class Meta:
        # 開始時刻（範囲の開始時刻）順に並べる
        ordering = ['timeslot_range']

class Reservation(models.Model):
    cafe = models.ForeignKey('accounts.BoardGameCafe', on_delete=models.CASCADE)  # どのカフェで予約か
    count = models.PositiveIntegerField(default=4)
    participant = models.ManyToManyField('accounts.CustomUser',through='Participant')
    max_participants = models.PositiveIntegerField(default=4)  # 最大参加人数を示すフィールド
    timeslot = models.ManyToManyField('cafes.TableTimeSlot',through='ReservationTimeSlot')
    reserved_at = models.DateTimeField(auto_now_add=True)
    reservation_type = models.CharField(max_length=20, choices=[('match', 'マッチング予約'), ('user', 'アプリ予約'), ('staff', '店舗予約')], default='user')
    is_active = models.BooleanField(default=True)
    is_recruiting = models.BooleanField(default=False)  # 募集中を表すフィールド
    game_class = models.ForeignKey('accounts.GameClass', on_delete=models.SET_NULL, null=True, blank=True)
    choice_game = models.ManyToManyField('accounts.BoardGame', blank=True,related_name='choice_game_reservations')
    play_game = models.ManyToManyField('accounts.BoardGame', blank=True,related_name='play_game_reservations')

    def save(self, *args, **kwargs):
        # max_participants と count が同じ場合は is_recruiting を False に設定
        if self.max_participants == self.count:
            self.is_recruiting = False
        # count が max_participants より少ない場合は is_recruiting を True に設定
        elif self.count < self.max_participants:
            self.is_recruiting = True

        super().save(*args, **kwargs)  # 親クラスの save メソッドを呼び出す


class Participant(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE,related_name='user_relations')
    user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='reservatin_relations')
    

class ReservationTimeSlot(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE,related_name='timeslot_relations')
    timeslot = models.ForeignKey('cafes.TableTimeSlot', on_delete=models.CASCADE,related_name='reservatin_relations')
    
    class Meta:
        unique_together = ('reservation', 'timeslot')  # 同じ予約とタイムスロットの組み合わせを一意に

class Message(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE, related_name='messages')  # メッセージが紐づく予約
    sender = models.ForeignKey('accounts.BaseUser', on_delete=models.CASCADE, null=True, blank=True)  # ユーザーが送信したメッセージ
    sender_is_staff = models.BooleanField(default=False)  # スタッフが送信したメッセージかどうか
    content = models.TextField()  # メッセージの内容
    sent_at = models.DateTimeField(auto_now_add=True)  # メッセージ送信日時
    read_by = models.ManyToManyField(
        'accounts.CustomUser', 
        related_name='read_messages', 
        blank=True
    )  # メッセージを読んだユーザー
    read_by_staff = models.ManyToManyField(  # スタッフがメッセージを読んだか追跡する
        'accounts.CafeStaff',
        related_name='read_messages',
        blank=True
    )
    is_deleted = models.BooleanField(default=False)  # メッセージが削除されたかどうか

    def __str__(self):
        sender_name = "スタッフ" if self.sender_is_staff else str(self.sender)
        return f"Message from {sender_name} on {self.sent_at}"

    class Meta:
        ordering = ['sent_at']  # 送信日時順に並べる
