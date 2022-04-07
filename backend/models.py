import uuid
from django.db import models
from tinymce.models import HTMLField
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.utils import timezone
from django.template.defaultfilters import slugify # new

from markdownfield.models import MarkdownField, RenderedMarkdownField
from markdownfield.validators import VALIDATOR_STANDARD

# Create your models here.
class Category(models.Model):
	title = models.CharField('Title Category', max_length=100)
	index = models.IntegerField(default=0)
	created = models.DateTimeField(editable=False, auto_now_add=True)
	modified = models.DateTimeField(editable=False, auto_now=True)

	def __str__(self):
		return "%s#%s" % ( self.index , self.title)

class Article(models.Model):
	category = models.ForeignKey(Category, related_name='article', on_delete=models.SET_NULL, null=True)
	title = models.CharField('Title Article', max_length=100)
	index = models.IntegerField(default=0)
	content = HTMLField()
	created = models.DateTimeField(editable=False, auto_now_add=True)
	modified = models.DateTimeField(editable=False,  auto_now=True)

	def __str__(self):
		return "%s#%s" % ( self.index , self.title)

	def url(self):
		return self.title.replace(" ","_")

	def sortContent(self):
		return self.content[:100]
		

class Player(models.Model):
	LOG  = ((0,'Turn off'), (1, 'Turn On'))
	user				= models.OneToOneField(User, on_delete=models.CASCADE, related_name='player')
	avatar				= models.ImageField('Avatar Url',upload_to='', default=None, blank=True)
	phoneNumber     	= models.CharField('Phone number',max_length=15, null=True, blank=True)
	graduation      	= models.CharField('Graduation', max_length=4, null=True, blank=True)
	university      	= models.CharField('University', max_length=100, null=True, blank=True)
	botLog          	= models.IntegerField('Bot Logs', choices=LOG, default=0)
	isJoin          	= models.BooleanField('Is Join', default=False)
	solved_questions	= models.ManyToManyField("Question", related_name="solved_by", blank=True)
	total_score			= models.IntegerField(null=False, blank=False, default=0)
	
	def __str__(self):
		return self.user.username

	def is_active(self):
		return self.user.is_active

	def is_enablelog(self):
		return self.botLog

	def is_jointournament(self):
		return self.isJoin

	def getAvatar(self):
		if self.avatar:
			return  self.avatar.url
		else:
			return "/static/img/avatar.png"

class Compile(models.Model):
	LANG            = (("cpp", 'C++'), ("java", 'Java'))
	STATE           = ((0, 'Compile successfully'), (1, 'Compile Failed'), (2, 'Is Compiling'))

	uid 			= models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user            = models.ForeignKey(User, related_name='Compile_User', on_delete=models.CASCADE)
	content         = models.TextField()
	language        = models.CharField('Language', max_length=5, choices=LANG, default='cpp')
	taskID          = models.CharField('TaskID', max_length=126, editable=False, null=True, default=None, blank=True)
	state           = models.IntegerField('State', choices=STATE, null=True, default=None, blank=True)
	localFile       = models.CharField('File Path', max_length=256, null=True, default=None, blank=True)
	created         = models.DateTimeField(editable=False, auto_now_add=True)
	modified        = models.DateTimeField(editable=False,  auto_now=True)
	question		= models.ForeignKey('Question', related_name='compile_logs', on_delete=models.CASCADE, null=False, blank=False)
	log				= models.TextField(null=True, blank=True)
	exit_status		= models.IntegerField(null=True, blank=True)

	def __str__(self):
		return "%s" % (self.taskID)

	def get_compiled_file(self):
		if self.language == 'java':
			path = "java -cp %s %s" % (self.localFile[:-12], self.localFile[-12:])
		else:
			path = self.localFile
		return command_line


class Round(models.Model):
	name       = models.CharField('Round Name', max_length=255, null=True, blank=True)
	active     = models.BooleanField('Active', default=False)
	created    = models.DateTimeField(auto_now_add=True, null=True,)
	modified   = models.DateTimeField(auto_now=True)
	user       = models.ForeignKey(User, related_name='Round_User', on_delete=models.CASCADE)

	def __str__(self):
		return "%s" % (self.name)

class Round_Group(models.Model):
	roundid       = models.ForeignKey(Round, related_name='Round_Group', on_delete=models.CASCADE, null=True)
	groupid       = models.ForeignKey(Group, related_name='Round_Group', on_delete=models.CASCADE, null=True)

	def __str__(self):
		return "%s" % (self.roundid.name)

class Notification(models.Model):
	title       = models.CharField(max_length=100)
	message     = models.TextField(default="")
	created     = models.DateTimeField(editable=False, auto_now_add=True)
	def __str__(self):
		return  self.title


class RecordNotify(models.Model):
	user        = models.ForeignKey(User,related_name='RecordNotify_User', on_delete=models.CASCADE)
	notify      = models.ForeignKey(Notification,related_name='RecordNotify_Notify', on_delete=models.CASCADE)

	def __str__(self):
		return "%s" % (self.user.username)


class WinRate(models.Model):
	win_rate    = models.DecimalField(default=0,max_digits=4,decimal_places = 2)
	allMatch    = models.IntegerField(default=0)
	winMatch    = models.IntegerField(default=0)


class Setting(models.Model):
	key         = models.CharField('Key', max_length=255, blank=True)
	value       = models.TextField('Value')

	def __str__(self):
		return "%s" % self.key


class SkillSet(models.Model):
	title		= models.CharField(max_length=25, null=False, blank=False)
	description = models.CharField(max_length=255, null=True, blank=True)
	enabled		= models.BooleanField(default=True)
	
	def __str__(self):
		return self.title


class SolutionTemplate(models.Model):
	language = models.CharField('Language', max_length=5, choices=Compile.LANG, default='cpp')
	content = models.TextField(null=True, blank=True, default='')
	question = models.ForeignKey("Question", related_name="solution_templates", on_delete=models.CASCADE, null=False, blank=False)
	created = models.DateTimeField(editable=False, auto_now_add=True)


class Question(models.Model):
	DATA_TYPES = (
		("int", "INT"),
		("char", "CHAR"),
	)
	LEVELS = (
		(0, "Easy"),
		(1, "Medium"),
		(2, "Hard"),
	)
	
	title				= models.CharField(max_length=50, null=False, blank=False)
	slug				= models.SlugField(null=False, blank=True, unique=True)
	created_at			= models.DateTimeField(auto_now_add=True)
	modified_at			= models.DateTimeField(auto_now=True)
	short_description	= models.CharField(max_length=255, null=True, blank=True)
	description			= HTMLField()
	input_type			= models.CharField(choices=DATA_TYPES, max_length=10, null=False, blank=True)
	output_type			= models.CharField(choices=DATA_TYPES, max_length=10, null=False, blank=True)
	difficulty 			= models.IntegerField(choices=LEVELS, default=0)
	score				= models.IntegerField(null=False, blank=False, default=10)
	skillset			= models.ForeignKey(SkillSet, related_name="questions", null=False, blank=False, on_delete=models.CASCADE)

	def __str__(self):
		return self.description
		
	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = slugify(self.title)
		return super().save(*args, **kwargs)
		

class TestCase(models.Model):
	tc_id 		= models.IntegerField(blank=True, null=False, default=1)
	question 	= models.ForeignKey(Question, related_name="test_cases", on_delete=models.CASCADE)
	input_line	= models.TextField(null=False, blank=True)
	output		= models.CharField(null=False, blank=True, max_length=255)
	created_at	= models.DateTimeField(auto_now_add=True)
	modified_at	= models.DateTimeField(auto_now=True)
	enabled		= models.BooleanField(null=False, default=True)
	hidden		= models.BooleanField(null=False, default=True)
	
	def __str__(self):
		return f"Question {self.question.pk} - {self.tc_id}"
		
	def save(self, *args, **kwargs):
		if not self.tc_id:
			self.tc_id = self.question.test_cases.count() + 1
		super(TestCase, self).save(*args, **kwargs)
		
		
class TestResult(models.Model):
	uid = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
	testcase	= models.ForeignKey(TestCase, on_delete=models.CASCADE, related_name='test_results', null=False, blank=False)
	output		= models.CharField(null=False, blank=True, max_length=255)
	created		= models.DateTimeField(auto_now_add=True)
	submission	= models.ForeignKey("Submission", on_delete=models.CASCADE, related_name="test_results", null=False, blank=False)
	passed		= models.BooleanField(null=False, blank=False, default=None)

	class Meta:
		unique_together = ('testcase', 'submission')
		

class Submission(models.Model):
	STATUS = (
		(1, "Wrong Answer"),
		(2, "Compilation Error"),
		(0, "Accepted")
	)
	uid = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
	created_at	= models.DateTimeField(auto_now_add=True)
	question	= models.ForeignKey(Question, related_name="submissions", on_delete=models.CASCADE, null=False, blank=False)
	status		= models.IntegerField(blank=True, null=True, choices=STATUS, default=None)
	score		= models.FloatField(null=False, blank=True, default=0)
	compile_log	= models.OneToOneField(Compile, related_name="submission", on_delete=models.CASCADE, null=False, blank=False)
	player		= models.ForeignKey(Player, related_name="submissions", on_delete=models.CASCADE, null=False, blank=False)
	
	def get_url(self):
		return f'/submission/{self.uid}'


class Module(models.Model):
	title		= models.CharField(max_length=30, null=False, blank=False)
	description	= models.CharField(max_length=255, null=True, blank=True)
	created_at	= models.DateTimeField(auto_now_add=True)
	enabled		= models.BooleanField(null=False, default=False)
	questions	= models.ManyToManyField(Question, related_name="modules", blank=True)
	# difficulty based on avg difficulty of all questions
	
	def __str__(self):
		return self.title
	
	
