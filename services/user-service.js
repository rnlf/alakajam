 'use strict'

/**
 * User service
 *
 * @module services/user-service
 */

 const crypto = require('crypto')
 const randomKey = require('random-key')
 const settingService = require('../services/setting-service')
 const User = require('../models/user-model')

 module.exports = {
   findById,
   findByName,
   register,
   authenticate,
   setPassword
 }

 const SETTING_PASSWORD_PEPPER = 'password_pepper'

/**
 * Fetches a User
 * @param uuid {uuid} UUID
 * @returns {User}
 */
 async function findById (uuid) {
   return User.where('uuid', uuid).fetch()
 }

/**
 * Fetches a User
 * @param name {name} name
 * @returns {User}
 */
 async function findByName (name) {
   return User.where('name', name).fetch()
 }

/**
 * Registers a new user
 * @param name {string} name
 * @param password {string} clear password (will be hashed before storage)
 * @returns {User|boolean} The User, or false if the user is already taken
 */
 async function register (name, password) {
   let count = await User.where('name', name).count()
   if (count === 0) {
     let user = new User({
       name: name,
       title: name
     })
     setPassword(user, password)
     await user.save()
     return user
   } else {
     return false
   }
 }

/**
 * Authenticates against a user name and password, and updates the session accordingly
 * @param name {string} name
 * @param password {string} clear password (will be hashed & compared to the DB entry)
 * @returns {User} The User, or false if the authentication failed
 */
 async function authenticate (name, password) {
   let user = await User.query(function (query) {
     query.where('name', name).orWhere('email', name)
   }).fetch()
   if (user) {
     let hashToTest = hashPassword(password, user.get('password_salt'))
     if (hashToTest === user.get('password')) {
       return user
     }
   }
   return false
 }

/**
 * Sets a password to a User
 * @param {User} user User model
 * @param {string} password New password, in clear form
 */
 function setPassword(user, password) {
  let salt = randomKey.generate()
  user.set('password_salt', salt)
  let hash = hashPassword(password, salt)
  user.set('password', hash)
 }

 function hashPassword (password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
 }
