# Generated by Django 2.2.4 on 2022-01-17 08:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0004_auto_20220117_1517'),
    ]

    operations = [
        migrations.AddField(
            model_name='testcase',
            name='input_type',
            field=models.CharField(blank=True, choices=[('int', 'INT'), ('char', 'CHAR')], max_length=10),
        ),
    ]
