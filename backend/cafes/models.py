from django.db import models
from django.contrib.postgres.fields import DateTimeRangeField
from django.utils import timezone
from datetime import timedelta, datetime


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
        return self.table_name

    def create_weekly_timeslots(self):
        # カフェテーブルが作成された日時
        created_at = self.created_at if hasattr(self, 'created_at') else timezone.now()

        # その週の月曜日を計算
        start_of_week = created_at - timedelta(days=created_at.weekday())  # Monday of the week

        # カフェの営業時間を取得
        opening_time = self.cafe.opening_time  # 営業開始時間
        closing_time = self.cafe.closing_time  # 営業終了時間

        # 1週間ごとのタイムスロットを4週間分作成
        for week_offset in range(4):  # 4週間分
        # 各曜日（月曜日から日曜日）のタイムスロットを作成
            for day_offset in range(7):  # 月曜日から日曜日
                day_start = start_of_week + timedelta(weeks=week_offset, days=day_offset)  # 各曜日の日付
                current_time = timezone.make_aware(datetime.combine(day_start, opening_time))
                end_time = timezone.make_aware(datetime.combine(day_start, closing_time))

            # 営業時間内に30分ごとにタイムスロットを作成
                while current_time < end_time:
                    next_time = current_time + timedelta(minutes=30)
                
                    # timeslot_range を作成して保存
                    timeslot_range = (current_time, next_time)
                
                # 新しいタイムスロットを作成
                    TableTimeSlot.objects.create(
                        table=self,
                        timeslot_range=timeslot_range,  # DateTimeRangeFieldを使用
                    )
                
                # 30分進める
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
    table = models.ForeignKey('cafes.CafeTable', on_delete=models.CASCADE)
    participant = models.ManyToManyField('accounts.CustomUser',through='Participant')
    timeslot = models.ManyToManyField('cafes.TableTimeSlot',through='ReservationTimeSlot')
    reserved_at = models.DateTimeField(auto_now_add=True)
    reservation_type = models.CharField(max_length=20, choices=[('match', 'マッチング予約'), ('user', 'アプリ予約'), ('staff', '店舗予約')], default='user')


class Participant(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE,related_name='user_relations')
    user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='reservatin_relations')
    

class ReservationTimeSlot(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE,related_name='timeslot_relations')
    timeslot = models.ForeignKey('cafes.TableTimeSlot', on_delete=models.CASCADE,related_name='reservatin_relations')
    
    class Meta:
        unique_together = ('reservation', 'timeslot')  # 同じ予約とタイムスロットの組み合わせを一意に

