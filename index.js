const express = require('express');
const app = express();
const bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const winston = require('winston');
require('dotenv').config()

// Logger configuration
const logConfiguration = {
  transports: [
    new winston.transports.File({
      filename: './logger/winstonlogs.log',
    }),
  ],
};

// Create the winston logger
const logger = winston.createLogger(logConfiguration);

let hashPin;
let email = ''
let voucherMount = 1000;
let generationTime;
let redeemCount = 5;
let token;

// generate voucher with email
app.post('/voucher/generate', async (req, res) => {
  if (req.body.email) {
    let pin = Math.random().toString(36).substring(7);
    hashPin = await bcrypt.hash(pin, 10)
    const code = "VCD" + (Math.random().toString(36).substring(2));
    token = jwt.sign({ foo: req.body.email }, 'token');
    email = req.body.email;
    generationTime = new Date();
    const voucherDetail = {
      code,
      Pin: hashPin,
      Email: email,
      voucherMount,
      generationTime,
      token
    }
    /*setting up  sender username and password */
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD
      }
    });

    /* setting receivers email  */
    var mailOptions = {
      from: 'udaydorai@gmail.com',
      to: email,
      subject: 'Voucher code',
      text: `Congratulations \n Voucher: ${code} \n PIN: ${pin}`
    };

    /* sending email and response */
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        res.status(403).send(voucherDetail);
      } else {
        logger.info({ voucherDetail })
        res.status(200).send(voucherDetail);

      }
    });
  }

});



// To redeem voucher
app.post('/voucher/redeem', verifyToken, async (req, res) => {
  const emailReq = req.body.email;
  const pinReq = req.body.pin;
  const redeemAmount = req.body.redeemAmount;
   
  if (email === emailReq) {         /* check the email*/
    if (bcrypt.compareSync(pinReq, hashPin)) { /*check hashpin & pin */
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1)
      if (generationTime <= currentDate && voucherMount - redeemAmount >= 0 && redeemCount > 0) {
        voucherMount = voucherMount - redeemAmount;
        redeemCount--;

        let response = {
          Email: emailReq,
          Pin: pinReq,
          redeemAmount,
          currentTime: currentDate,
          "remaining voucher amount": voucherMount
        }

        logger.info({ response }) /*send detail log */
        res.status(200).send(response); /* sending response */
      } else {
        res.status(200).send('expired');
      }
    }else{
      res.status(403).send(`"message":"incorrect pin"`)
    }

  } else {
    res.status(200).send(`"message":"incorrect email or pin"`)
  }
})

// to verify the token
function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (typeof header !== 'undefined') {
    const bearer = header.split(' ');
    const Btoken = bearer[1];
    if (Btoken === token) {
      req.token = Btoken;
      next();
    } else {
      res.sendStatus(403)
    }

  } else {
    res.sendStatus(403)
  }
}

const port = process.env.PORT || 8000;
const server = app.listen(port, function () {
  console.log(`listening to the port ${port}`);
});

