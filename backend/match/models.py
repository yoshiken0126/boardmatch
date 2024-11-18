#from accounts.models import CustomUser
#from accounts.models import BoardGameCafe
from django.db import models
from django.db.models import DateField, DateTimeField, ManyToManyField
from django.forms import BooleanField


# Create your models here.

class UserFreeTime(models.Model):
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    monday = models.BooleanField(default=False,verbose_name='月')
    tuesday = models.BooleanField(default=False,verbose_name='火')
    wednesday = models.BooleanField(default=False,verbose_name='水')
    thursday = models.BooleanField(default=False,verbose_name='木')
    friday = models.BooleanField(default=False,verbose_name='金')
    saturday = models.BooleanField(default=False,verbose_name='土')
    sunday = models.BooleanField(default=False,verbose_name='日')
    def as_list(self):
        return [
            self.monday,
            self.tuesday,
            self.wednesday,
            self.thursday,
            self.friday,
            self.saturday,
            self.sunday,
        ]

class UserRelation(models.Model):
    from_user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='from_user')
    to_user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='to_user')
    may_follow = models.BooleanField(default=False)
    must_follow = models.BooleanField(default=False)
    blocked = models.BooleanField(default=False)

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

    class Meta:
        unique_together = ('user', 'game', 'can_instruct','want_to_play','not_for_me')


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