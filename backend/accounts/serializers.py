from rest_framework import serializers
from .models import CustomUser,CafeStaff
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomUserSerializer(serializers.ModelSerializer): #追記　Userのシリアライザー
    game_class = serializers.StringRelatedField(many=True)
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username','password','is_optimize_active','email','profile_picture','game_class')
        extra_kwargs = {'password':{'write_only': True}} #パスワードフィールドを書き込み専用にする
    
    def create(self, validated_data):#create時にcreate_userメソッドを使用
        user = CustomUser.objects.create_user(**validated_data)
        return user

class StaffUserSerializer(serializers.ModelSerializer): #salonのシリアライザー
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)

    class Meta:
        model = CafeStaff
        fields = ['id', 'username', 'password', 'cafe','cafe_name']
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