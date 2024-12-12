from django.shortcuts import render,redirect
from accounts.models import CustomUser, BoardGameCafe, CafeStaff, BoardGame
from match.models import UserCafeRelation, UserFreeTime, MatchDay, MatchDayUser,UserRelation
from cafes.forms import CafeGameRelationForm,CafeGameRelation,StaffGameRelation,StaffGameRelationForm
from django.http import HttpResponse
# Create your views here.
from mip import Model,maximize,xsum
import numpy as np
import datetime,random
from .models import CafeTable
from .serializers import CafeTableSerializer
from accounts.serializers import StaffUserSerializer
from accounts.permissions import IsStaffUser
from rest_framework import viewsets
from rest_framework.response import Response



class CafeTableViewSet(viewsets.ModelViewSet):
    serializer_class = CafeTableSerializer
    
    def get_object(self):
        # ログインユーザーの情報を取得
        return self.request.user

    def get_queryset(self):
        user = self.get_object()
        print(f"{user}です。")
        staff = CafeStaff.objects.get(username=user.username)
        cafe = staff.cafe
        print(cafe)

        return CafeTable.objects.filter(cafe=cafe)  # カフェに関連するテーブルのみ返す

       

class StaffInfoViewSet(viewsets.GenericViewSet):
    permission_classes = [IsStaffUser]  # ログインユーザーのみアクセス可能
    serializer_class = StaffUserSerializer

    def get_object(self):
        # ログインユーザーの情報を取得
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        # ログインユーザーの情報を取得してシリアライズして返す
        user = self.get_object()
        staffuser = CafeStaff.objects.get(username=user.username)
        serializer = self.get_serializer(staffuser)
        return Response(serializer.data)
























































































def otamesi(request):
    return HttpResponse('お試し')

def register_boardgame(request):
    if request.method == 'POST':
        form = CafeGameRelationForm(request.POST)
        if  form.is_valid():
            game = form.save(commit=False)
            user = request.user
            staff = CafeStaff.objects.get(username=user.username)
            game.cafe = staff.cafe
            game.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        staff = CafeStaff.objects.get(username=user.username)
        games = BoardGame.objects.filter(cafe_relations__cafe=staff.cafe)
        form = CafeGameRelationForm(instance=staff.cafe)
    return render(request, 'cafes/register_boardgame.html', {'form': form,'games':games,'staff':staff})

def staff_can_instruct(request):
    if request.method == 'POST':
        form = StaffGameRelationForm(request.POST)
        if  form.is_valid():
            game = form.save(commit=False)
            user = request.user
            staff = CafeStaff.objects.get(username=user.username)
            game.staff = staff
            game.can_instruct = True
            game.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        staff = CafeStaff.objects.get(username=user.username)
        game_list = BoardGame.objects.filter(staff_relations__staff = staff)
        form = StaffGameRelationForm(instance=staff)
    return render(request, 'cafes/staff_can_instruct.html', {'form': form,'game_list':game_list})

def show_cafe_schedule(request):
    user = request.user
    staff = CafeStaff.objects.get(username=user.username)
    matchdays = MatchDay.objects.filter(cafe=staff.cafe)

    return render(request,'cafes/show_cafe_schedule.html',{'matchdays':matchdays})