# Generated by Django 2.2.4 on 2022-02-16 10:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0057_remove_submission_compile_log'),
    ]

    operations = [
        migrations.AddField(
            model_name='submission',
            name='compile_log',
            field=models.OneToOneField(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='submission', to='backend.Compile'),
            preserve_default=False,
        ),
    ]
