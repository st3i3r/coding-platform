# Generated by Django 2.2.4 on 2022-02-11 10:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0041_auto_20220211_1451'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='question',
            name='solution_template',
        ),
        migrations.CreateModel(
            name='SolutionTemplate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('language', models.CharField(choices=[('cpp', 'C++'), ('java', 'Java')], default='cpp', max_length=5, verbose_name='Language')),
                ('content', models.TextField(blank=True, default='', null=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solution_templates', to='backend.Question')),
            ],
        ),
    ]
