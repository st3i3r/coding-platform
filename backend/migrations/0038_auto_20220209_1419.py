# Generated by Django 2.2.4 on 2022-02-09 07:19

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0037_auto_20220209_1416'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submission',
            name='compile_log',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='compile_log', to='backend.Compile'),
        ),
        migrations.AlterField(
            model_name='submission',
            name='player',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='backend.Player'),
        ),
    ]
