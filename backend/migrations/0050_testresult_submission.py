# Generated by Django 2.2.4 on 2022-02-16 03:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0049_auto_20220216_1025'),
    ]

    operations = [
        migrations.AddField(
            model_name='testresult',
            name='submission',
            field=models.ForeignKey(default='5bfbbe84-0bd6-4613-aa29-1fa629dcaaa8', on_delete=django.db.models.deletion.CASCADE, related_name='test_results', to='backend.Submission'),
            preserve_default=False,
        ),
    ]
