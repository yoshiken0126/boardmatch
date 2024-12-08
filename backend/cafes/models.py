from django.db import models

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

    def create_weekly_tabletimeslots(self):
    
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
                        TableTimeSlot.objects.create(
                        table=self,
                        start_time=current_time,
                        end_time=next_time
                        )
                        # 30分進める
                        current_time = next_time




class TableTimeSlot(models.Model):
    table = models.ForeignKey('cafes.CafeTable', on_delete=models.CASCADE, related_name='timeslot_relations')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_reserved = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)

    def __str__(self):
        return f"TableTimeSlot {self.start_time} - {self.end_time} ({'Reserved' if self.is_reserved else 'Available'})"

    class Meta:
        # 開始時刻順に並べる
        ordering = ['start_time']

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

