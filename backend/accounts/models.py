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
    def __str__(self):
        return self.name

class BoardGame(models.Model):
    name = models.CharField(max_length=15)
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