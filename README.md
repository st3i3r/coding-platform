# Backend

## Requirement
- Docker with extension Docker Compose
- Network

## How to run
- Switch to **Develop** branch.
- At root folder, run **docker-compose up**
- Wait until it checkout or build new images done.
- Attach shell to **AI_gunicorn** container with command: ** docker exec -ti AI_gunicorn /bin/bash **
- Run command create super users on Django Admin:  [/webservice] **python manage.py createsuperuser**
- Login admin at http://localhost/admin with user & password was created.

## Config Database
In Django Admin, at Backend section, 
Select **Round** and add new row default and set the id of it in **setting.py** at line ** DEFAULT_ROUND_ID = 1 #In Round table must a record default. Get id and set here. **

Select Settings and add new rows bellow:
- enable_custommatch : False # This is enable private match when tournament actived
- round_custom_match : 1 # Set custom match when create a custom match on Admin Panel
- match_time_out : 5 # Timeout of match
- row_in_page : 30 # Row in page on Match list, bot,...
- max_limit_bot : 7 # Maximum bot can add to match
- domain_name : http://localhost # domain name
- enable_tournament : False # Enable tourname or not. If enable_tournament is True, The players who don't set join tournament is True will don't compile code.