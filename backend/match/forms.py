from django import forms
from match.models import UserFreeTime
from django.forms import modelformset_factory
from .models import UserCafeRelation,UserGameRelation,UserRelation



class UserCafeRelationForm(forms.ModelForm):
    class Meta:
        model = UserCafeRelation
        fields = ['cafe','user','can_visit']


class UserCafeRelationForm(forms.ModelForm):
    class Meta:
        model = UserCafeRelation
        fields = ['cafe','user','can_visit']

class UserFreeTimeForm(forms.ModelForm):
    class Meta:
        model = UserFreeTime
        fields = ['user','monday_daytime', 'monday_nighttime',
                         'tuesday_daytime', 'tuesday_nighttime',
                         'wednesday_daytime', 'wednesday_nighttime', 
                         'thursday_daytime', 'thursday_nighttime', 
                         'friday_daytime', 'friday_nighttime', 
                         'saturday_daytime', 'saturday_nighttime', 
                         'sunday_daytime', 'sunday_nighttime']

class UserGameRelationForm(forms.ModelForm):
    class Meta:
        model = UserGameRelation
        fields = ['game',]

class UserUserRelationForm(forms.ModelForm):
    class Meta:
        model = UserRelation
        fields = ['to_user',]




UserCafeRelationFormset = modelformset_factory(UserCafeRelation, form=UserCafeRelationForm, extra=0)