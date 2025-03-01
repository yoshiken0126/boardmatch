# Generated by Django 5.1.3 on 2024-12-08 11:20

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_remove_boardgamecafe_capacity_and_more'),
        ('cafes', '0008_cafetable_participant_reservation_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='timeslot',
            name='is_closing',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='reservation',
            name='reservation_type',
            field=models.CharField(choices=[('match', 'マッチング予約'), ('user', 'アプリ予約'), ('staff', '店舗予約')], default='user', max_length=20),
        ),
        migrations.CreateModel(
            name='CafeOperatingHours',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_of_week', models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('opening_time', models.TimeField(blank=True, null=True)),
                ('closing_time', models.TimeField(blank=True, null=True)),
                ('is_closed', models.BooleanField(default=False)),
                ('cafe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='operating_hours', to='accounts.boardgamecafe')),
            ],
            options={
                'unique_together': {('cafe', 'day_of_week')},
            },
        ),
    ]
