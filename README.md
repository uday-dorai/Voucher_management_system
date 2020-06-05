 To start the project

Go to the project directory on terminal

Steps
1-npm init
2-npm run dev or npm start or node index.js

Add .env file
USERNAME ="email"
PASSWORD="password"


For testing api(postman)

To generate token
url:- http://localhost:8000/voucher/generate


body(raw)(json)
{
	"email":"email@email.com"
}

To redeem the voucher
url:- http://localhost:8000/voucher/redeem

header
key:Authorization
value: bearer (generated token)

body
{
    
    "pin": "pin",
    "email":"email@email.com",
    "redeemAmount": 100
}
