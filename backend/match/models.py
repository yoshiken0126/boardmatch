#from accounts.models import CustomUser
#from accounts.models import BoardGameCafe
from django.db import models
from django.db.models import DateField, DateTimeField, ManyToManyField
from django.forms import BooleanField
from django.core.exceptions import ValidationError


# Create your models here

class UserFreeDay(models.Model):
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    freeday = models.DateField()  # 自由な日
    daytime = models.BooleanField(default=False,verbose_name='昼')
    nighttime = models.BooleanField(default=False,verbose_name='夜')

    def clean(self):
        # 同じユーザーと同じ日に昼のインスタンスがすでに存在するかチェック
        if self.daytime and UserFreeDay.objects.filter(user=self.user, freeday=self.freeday, daytime=True).exists():
            raise ValidationError("このユーザーはすでに昼のインスタンスを作成しています。")

        # 同じユーザーと同じ日に夜のインスタンスがすでに存在するかチェック
        if self.nighttime and UserFreeDay.objects.filter(user=self.user, freeday=self.freeday, nighttime=True).exists():
            raise ValidationError("このユーザーはすでに夜のインスタンスを作成しています。")
        
    def save(self, *args, **kwargs):
        self.clean()  # 保存前にバリデーションを実行
        super().save(*args, **kwargs)


class UserFreeTime(models.Model):
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    monday_daytime = models.BooleanField(default=False,verbose_name='月昼')
    monday_nighttime = models.BooleanField(default=False,verbose_name='月夜')
    tuesday_daytime = models.BooleanField(default=False,verbose_name='火昼')
    tuesday_nighttime = models.BooleanField(default=False,verbose_name='火夜')
    wednesday_daytime = models.BooleanField(default=False,verbose_name='水昼')
    wednesday_nighttime = models.BooleanField(default=False,verbose_name='水夜')
    thursday_daytime = models.BooleanField(default=False,verbose_name='木昼')
    thursday_nighttime = models.BooleanField(default=False,verbose_name='木夜')
    friday_daytime = models.BooleanField(default=False,verbose_name='金昼')
    friday_nighttime = models.BooleanField(default=False,verbose_name='金夜')
    saturday_daytime = models.BooleanField(default=False,verbose_name='土昼')
    saturday_nighttime = models.BooleanField(default=False,verbose_name='土夜')
    sunday_daytime = models.BooleanField(default=False,verbose_name='日昼')
    sunday_nighttime = models.BooleanField(default=False,verbose_name='日夜')
    def as_list(self):
        return [
            self.monday_daytime,
            self.monday_nighttime,
            self.tuesday_daytime,
            self.tuesday_nighttime,
            self.wednesday_daytime,
            self.wednesday_nighttime,
            self.thursday_daytime,
            self.thursday_nighttime,
            self.friday_daytime,
            self.friday_nighttime,
            self.saturday_daytime,
            self.saturday_nighttime,
            self.sunday_daytime,
            self.sunday_nighttime,
        ]

class UserRelation(models.Model):
    from_user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='from_user')
    to_user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='to_user')
    may_follow = models.BooleanField(default=False)
    must_follow = models.BooleanField(default=False)
    blocked = models.BooleanField(default=False)
    memo = models.TextField(null=True, blank=True) 

class UserCafeRelation(models.Model):
    user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE)
    cafe = models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE)
    can_visit = models.BooleanField(default=False)
    scheduled = models.BooleanField(default=False)
    #class Meta:
        #unique_together = ('user', 'cafe')

class UserGameRelation(models.Model):
    user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='game_relations')
    game = models.ForeignKey('accounts.BoardGame',on_delete=models.CASCADE,related_name='user_relations')
    can_instruct = models.BooleanField(default=False)
    want_to_play = models.BooleanField(default=False)
    not_for_me = models.BooleanField(default=False)
    is_having = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'game', 'can_instruct','want_to_play','not_for_me','is_having')

    def delete_if_all_false(self):
        """
        全てのフィールドが False の場合、このインスタンスを削除する
        """
        if not any([self.can_instruct, self.want_to_play, self.not_for_me, self.is_having]):
            self.delete()


class MatchDay(models.Model):
    day = DateTimeField(null=True)
    cafe = models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE,null=True)
    game = models.ForeignKey('accounts.BoardGame',on_delete=models.CASCADE,null=True,related_name='game_to_matchday')
    choice = ManyToManyField('accounts.BoardGame',through='GameChoice',related_name='choice_to_matchday')
    user = ManyToManyField('accounts.CustomUser',through='MatchDayUser')


class MatchDayUser(models.Model):
    user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='matchday_relations')
    matchday = models.ForeignKey('match.MatchDay',on_delete=models.CASCADE,related_name='user_relations')

class GameChoice(models.Model):
    matchday = models.ForeignKey('match.MatchDay', on_delete=models.CASCADE,related_name='game_relations')
    game = models.ForeignKey('accounts.BoardGame', on_delete=models.CASCADE, related_name='matchday_relations')