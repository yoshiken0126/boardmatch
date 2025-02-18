from email.policy import default
from tkinter.constants import CASCADE

from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser
from match.models import UserCafeRelation,  UserFreeTime
from django.dispatch import receiver
from django.db.models.signals import post_save
from cafes.models import CafeTable



# Create your models here.

class BaseUser(AbstractUser):
    USER_TYPE_CHOICES = [
        ('master_user', 'マスターユーザー'),
        ('custom_user', 'カスタムユーザー'),
        ('staff_user', 'カフェスタッフ')
    ]
    user_type = models.CharField(
        max_length=20, 
        choices=USER_TYPE_CHOICES, 
        default=None,
        null=True
    )

class CustomUser(BaseUser):
    is_optimize_active = models.BooleanField(default=False,verbose_name='最適化アクティブ')
    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        # 新規作成時にuser_typeを自動設定
        if not self.pk:  # 新規オブジェクトの場合
            self.user_type = 'custom_user'
        super().save(*args, **kwargs)

class CafeStaff(BaseUser):
    cafe =models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE)

    class Meta:
        verbose_name = 'スタッフ'
        verbose_name_plural = 'スタッフ一覧'

    def save(self, *args, **kwargs):
        # 新規作成時にuser_typeを自動設定
        if not self.pk:  # 新規オブジェクトの場合
            self.user_type = 'staff_user'
        super().save(*args, **kwargs)


class BoardGameCafe(models.Model):
    name = models.CharField(max_length=10)
    opening_time = models.TimeField(default='13:00')  # 開店時間
    closing_time = models.TimeField(default='23:00')  # 閉店時間

    monday_open = models.TimeField(null=True, blank=True)  # 月曜日の開店時間
    monday_close = models.TimeField(null=True, blank=True)  # 月曜日の閉店時間
    
    tuesday_open = models.TimeField(null=True, blank=True)  # 火曜日の開店時間
    tuesday_close = models.TimeField(null=True, blank=True)  # 火曜日の閉店時間
    
    wednesday_open = models.TimeField(null=True, blank=True)  # 水曜日の開店時間
    wednesday_close = models.TimeField(null=True, blank=True)  # 水曜日の閉店時間
    
    thursday_open = models.TimeField(null=True, blank=True)  # 木曜日の開店時間
    thursday_close = models.TimeField(null=True, blank=True)  # 木曜日の閉店時間
    
    friday_open = models.TimeField(null=True, blank=True)  # 金曜日の開店時間
    friday_close = models.TimeField(null=True, blank=True)  # 金曜日の閉店時間
    
    saturday_open = models.TimeField(null=True, blank=True)  # 土曜日の開店時間
    saturday_close = models.TimeField(null=True, blank=True)  # 土曜日の閉店時間
    
    sunday_open = models.TimeField(null=True, blank=True)  # 日曜日の開店時間
    sunday_close = models.TimeField(null=True, blank=True)  # 日曜日の閉店時間

    def __str__(self):
        return self.name

    def get_opening_hours(self, day):
        opening_field = getattr(self, f"{day}_open")
        closing_field = getattr(self, f"{day}_close")
        
        if opening_field and closing_field:
            return f"{opening_field} - {closing_field}"
        return "Closed"



class Designer(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class GameCategory(models.Model):
    name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name

class GameMechanic(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class BoardGame(models.Model):
    name = models.CharField(max_length=100)
    designers = models.ManyToManyField(Designer, related_name='boardgames',blank=True)  # 複数のデザイナー
    min_playtime = models.IntegerField(help_text="最短プレイ時間 (分)", blank=True, null=True)  # 最短プレイ時間（分）
    max_playtime = models.IntegerField(help_text="最長プレイ時間 (分)", blank=True, null=True)  # 最長プレイ時間（分）
    min_players = models.IntegerField(help_text="最小人数", default=2)  # 最小プレイ人数
    max_players = models.IntegerField(help_text="最大人数", default=4)  # 最大プレイ人数
    short_description = models.CharField(max_length=255, blank=True, null=True)  # 簡単な紹介文
    long_description = models.TextField(blank=True, null=True)  # 詳細な紹介文
    game_categories = models.ManyToManyField(GameCategory, related_name='boardgames',blank=True)  # ゲームの分類（軽量級、中量級、重量級）
    game_mechanics = models.ManyToManyField(GameMechanic, related_name='boardgames',blank=True)  # ゲームメカニクス（例: ワーカープレイスメント、ダイスロールなど）
    box_image = models.ImageField(upload_to='boardgame_images/box/', blank=True, null=True)  # 箱絵の画像
    board_image = models.ImageField(upload_to='boardgame_images/board/', blank=True, null=True)  # ボード盤面の画像
    created_at = models.DateTimeField(auto_now_add=True)  # 作成日時
    updated_at = models.DateTimeField(auto_now=True)  # 更新日時

    def __str__(self):
        return self.name

@receiver(post_save, sender=CustomUser)
def create_user_relations(sender, instance, created, **kwargs):
    if created:
        for cafe_instance in BoardGameCafe.objects.all():
            UserCafeRelation.objects.create(user=instance, cafe=cafe_instance, can_visit=False)

@receiver(post_save, sender=BoardGameCafe)
def create_user_relations(sender, instance, created, **kwargs):
    if created:
        for user_instance in CustomUser.objects.all():
            UserCafeRelation.objects.create(user=user_instance, cafe=instance, can_visit=False)

@receiver(post_save, sender=CustomUser)
def create_user_relations(sender, instance, created, **kwargs):
    if created:
        #for cafe_instance in BoardGameCafe.objects.all():
            UserFreeTime.objects.create(
            user=instance,
            monday_daytime=False, tuesday_daytime=False, wednesday_daytime=False, 
            thursday_daytime=False, friday_daytime=False, saturday_daytime=False, sunday_daytime=False,
            monday_nighttime=False, tuesday_nighttime=False, wednesday_nighttime=False,
            thursday_nighttime=False, friday_nighttime=False, saturday_nighttime=False, sunday_nighttime=False
        )

@receiver(post_save, sender=CafeTable)
def create_timeslots_for_new_table(sender, instance, created, **kwargs):
    if created:
        instance.create_weekly_timeslots()