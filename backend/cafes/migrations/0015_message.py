# Generated by Django 5.1.3 on 2025-02-11 10:47

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_boardgamecafe_friday_close_boardgamecafe_friday_open_and_more'),
        ('cafes', '0014_reservation_count'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sender_is_staff', models.BooleanField(default=False)),
                ('content', models.TextField()),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('read_by', models.ManyToManyField(blank=True, related_name='read_messages', to='accounts.customuser')),
                ('read_by_staff', models.ManyToManyField(blank=True, related_name='read_messages', to='accounts.cafestaff')),
                ('reservation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='cafes.reservation')),
                ('sender', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['sent_at'],
            },
        ),
    ]
