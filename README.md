## Create virtual env
python3 -m venv venv
source venv/bin/activate

## Install dependencies
pip install -r requirements.in

## Run application
### Redis
<code>redis-server</code>

### Celery
<code>celery -A webserivce worker -l INFO</code>

### Django
<code>python3 manage.py runserver</code>
