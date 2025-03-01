# Generated by Django 5.1.3 on 2025-03-02 07:26

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0017_customuser_game_class_customuser_prefecture_and_more'),
        ('cafes', '0020_remove_reservation_play_game_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reservation',
            name='play_game_by_user',
        ),
        migrations.RemoveField(
            model_name='reservation',
            name='play_game_in_cafe',
        ),
        migrations.CreateModel(
            name='PlayGame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_provider_type', models.CharField(choices=[('cafe', 'カフェ'), ('user', 'ユーザー')], default='cafe', max_length=10)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='playgames', to='accounts.boardgame')),
                ('instructor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='instructed_games', to=settings.AUTH_USER_MODEL)),
                ('provider', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='provided_games', to='accounts.customuser')),
                ('reservation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cafes.reservation')),
            ],
            options={
                'unique_together': {('reservation', 'game', 'game_provider_type')},
            },
        ),
        migrations.AddField(
            model_name='reservation',
            name='play_game',
            field=models.ManyToManyField(blank=True, related_name='play_game_reservations', through='cafes.PlayGame', to='accounts.boardgame'),
        ),
    ]
