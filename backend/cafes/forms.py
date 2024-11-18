from .models import CafeGameRelation,StaffGameRelation
from django.forms import modelformset_factory
from django import forms

class CafeGameRelationForm(forms.ModelForm):
    class Meta:
        model = CafeGameRelation
        fields = ['game',]

class StaffGameRelationForm(forms.ModelForm):
    class Meta:
        model = StaffGameRelation
        fields = ['game',]

#CafeGameRelationFormset = modelformset_factory(CafeGameRelation, form=CafeGameRelationForm, extra=0)