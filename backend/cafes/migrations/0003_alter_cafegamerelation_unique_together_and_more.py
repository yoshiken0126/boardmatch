# Generated by Django 4.2.16 on 2024-10-19 09:23

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('cafes', '0002_staffgamerelation'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='cafegamerelation',
            unique_together={('cafe', 'game')},
        ),
        migrations.RemoveField(
            model_name='cafegamerelation',
            name='in_cafe',
        ),
    ]
