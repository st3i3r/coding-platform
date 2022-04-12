## Create virtual env
<code>python3 -m venv venv
source venv/bin/activate</code>

## Install dependencies
<code>pip install -r requirements.in</code>

## Run application
### Redis
<code>redis-server</code>

### Celery
<code>celery -A webserivce worker -l INFO</code>

### Django
<code>python3 manage.py runserver</code>
