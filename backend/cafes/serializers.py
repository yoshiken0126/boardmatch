from rest_framework import serializers
from .models import CafeTable

class CafeTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafeTable
        fields = ['id', 'table_name', 'capacity']