from django.db import models

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
