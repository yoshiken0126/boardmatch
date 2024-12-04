from rest_framework import serializers
from .models import CustomUser,CafeStaff
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomUserSerializer(serializers.ModelSerializer): #追記　Userのシリアライザー
    class Meta:
        model = CustomUser
        fields = ('id', 'username','password','is_optimize_active')
        extra_kwargs = {'password':{'write_only': True}} #パスワードフィールドを書き込み専用にする
    
    def create(self, validated_data):#create時にcreate_userメソッドを使用
        user = CustomUser.objects.create_user(**validated_data)
        return user

class CafeStaffSerializer(serializers.ModelSerializer): #salonのシリアライザー
    class Meta:
        model = CafeStaff
        fields = ['id', 'name', 'address', 'description','phone_number','email','image','created_at','updated_at']
        extra_kwargs = {'password':{'write_only': True}} #パスワードフィールドを書き込み専用にする

    #def get_image(self, obj):
        #if obj.image:
            #return self.context['request'].build_absolute_uri(obj.image.url)
        #return None

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # 基本的な認証を実行
        data = super().validate(attrs)
        
        # ユーザータイプを追加
        data['user_type'] = self.user.user_type
        return data