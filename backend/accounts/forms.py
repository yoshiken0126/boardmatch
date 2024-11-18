from .models import CustomUser,BoardGameCafe,CafeStaff,BoardGame
from django import forms
from django.contrib.auth.forms import UserCreationForm

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ('username',)

class CafeStaffCreationForm(UserCreationForm):
    class Meta:
        model = CafeStaff
        fields = ('username','cafe','is_staff')

class CustomUserIsActiveForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ('is_active',)


class BoardGameCafeForm(forms.ModelForm):
    class Meta:
        model = BoardGameCafe
        fields = ('name',)

class BoardGameForm(forms.ModelForm):
    class Meta:
        model = BoardGame
        fields = ('name',)

