# Generated by Django 5.1.3 on 2025-02-14 11:39

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cafes', '0016_reservation_is_active'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reservation',
            name='table',
        ),
    ]
