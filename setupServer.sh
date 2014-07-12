
#sudo echo "fluffy ALL = NOPASSWD: ALL"  > /etc/sudoers.d/cullen ; 
#sudo chmod 0440 /etc/sudoers.d/cullen 
#sudo echo "fluffy ALL=(postgres) NOPASSWD: ALL"  >> /etc/sudoers.d/cullen

sudo apt-get update
   
sudo apt-get -y install ufw
sudo ufw default deny
sudo ufw logging on
sudo ufw allow ssh/tcp
sudo ufw limit ssh/tcp
sudo ufw allow http/tcp
sudo ufw allow https/tcp
#sudo ufw allow http-alt/tcp
echo y | sudo ufw enable

sudo apt-get -y upgrade


sudo apt-get -y install fail2ban
sudo apt-get -y install logcheck logcheck-database

echo "America/Edmonton" | sudo tee /etc/timezone
sudo dpkg-reconfigure --frontend noninteractive tzdata

sudo apt-get -y remove ax25-node libax25


sudo apt-get -y install emacs23-nox git-core build-essential gcc tcsh
sudo apt-get -y install curl 

sudo sh -c 'echo "deb http://stable.packages.cloudmonitoring.rackspace.com/ubuntu-14.04-x86_64 cloudmonitoring main" > /etc/apt/sources.list.d/rackspace-monitoring-agent.list'
curl https://monitoring.api.rackspacecloud.com/pki/agent/linux.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install rackspace-monitoring-agent

#sudo apt-get -y install mongodb
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt-get update
sudo apt-get -y install mongodb-org
#sudo /etc/init.d/mongod start
sudo service mongod start

sudo apt-get -y install redis
sudo apt-get -y install redis-server
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.default
sudo service redis-server restart

curl http://www.rabbitmq.com/rabbitmq-signing-key-public.asc  | sudo apt-key add -
sudo apt-get update

sudo apt-get -y install rabbitmq-server
sudo apt-get -y install rabbitmq

sudo apt-get -y install nodejs
sudo apt-get -y install npm 
#sudo apt-get -y install node-legacy
sudo ln -s `which nodejs` /usr/local/bin/node

sudo npm install -g forever
sudo npm install -g forever-monitor
    
#ssh-keyscan -H github.com >> ~/.ssh/known_hosts

sudo apt-get -y install nginx 

sudo rm /etc/nginx/sites-enabled/default

sudo mkdir /usr/local/sink
sudo touch /usr/local/sink/serv.js
sudo touch /etc/nginx/sites-available/sink-prod.conf
sudo ln -s /etc/nginx/sites-available/sink-prod.conf /etc/nginx/sites-enabled/sink-prod.conf

sudo mkdir /usr/local/sink-test
sudo touch /usr/local/sink-test/serv.js
sudo touch /etc/nginx/sites-available/sink-test.conf
sudo ln -s /etc/nginx/sites-available/sink-test.conf /etc/nginx/sites-enabled/sink-test.conf

sudo forever start --sourceDir /usr/local/sink -d -v -o /var/log/sink-out.log -e /var/log/sink-err.log -l /var/log/sink.log -a --watchDirectory /usr/local/sink --minUptime 3000 --spinSleepTime 5000 serv.js

sudo forever start --sourceDir /usr/local/sink-test -d -v -o /var/log/sink-test-out.log -e /var/log/sink-test-err.log -l /var/log/sink-test.log -a --watchDirectory /usr/local/sink-test --minUptime 3000 --spinSleepTime 5000 NODE_ENV=test node serv.js

sudo mkdir /etc/nginx/ssl
echo "you need to copy certs and key to /etc/nginx/ssl"


echo "You now need to do a 'grunt deploy' then run stuff in deploy.sh "


echo usefull commands
echo sudo forever restartall
echo sudo service nginx restart
