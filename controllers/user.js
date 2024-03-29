const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJs = require("crypto-js");
const dotenv = require('dotenv').config();

const User = require('../models/user');

const regexPassword = (password) => {
  let regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  return regex.test(password);
};

exports.signup = (req, res, next) => {
  let test = regexPassword(req.body.password);
  if (test) {
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        let cryptedEmail = cryptoJs.HmacSHA256(req.body.email, process.env.secretKey).toString();
        console.log(cryptedEmail);
        const user = new User({
          email: cryptedEmail,
          password: hash
        });
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  } else {
    return res.status(404).json({ message: 'Weak Password' });
  }
};

exports.login = (req, res, next) => {
  let cryptedEmail = cryptoJs.HmacSHA256(req.body.email, process.env.secretKey).toString();
  console.log(cryptedEmail);
  User.findOne({ email: cryptedEmail })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé !' });
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              'RANDOM_TOKEN_SECRET',
              { expiresIn: '4h' }
            )
          });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};