# Generated by Django 4.2.16 on 2024-10-20 00:16

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cafes', '0005_cafegamerelation_can_install'),
    ]

    operations = [
        migrations.RenameField(
            model_name='cafegamerelation',
            old_name='can_install',
            new_name='can_instruct',
        ),
        migrations.RenameField(
            model_name='staffgamerelation',
            old_name='can_install',
            new_name='can_instruct',
        ),
    ]
