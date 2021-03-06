import express from 'express'
import { Router as UnoRouter } from 'uno-api'
import { wrapperRequest } from '../helper'

const router = express.Router()
const apiRouter = new UnoRouter(router)

// Modules
const AuthController = require('../controllers/AuthController')
const RoleController = require('../controllers/RoleController')
const UserController = require('../controllers/UserController')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

// Authentication
apiRouter.create({
  baseURL: '/auth',
  postWithParam: [
    ['signup', AuthController.signUp],
    ['signin', AuthController.signIn],
  ],
  wrapperRequest,
})

// User
apiRouter.create({
  baseURL: '/user',
  get: UserController.getAll,
  getWithParam: [[':id', UserController.getOne]],
  wrapperRequest,
})

// Master Role
apiRouter.create({
  baseURL: '/role',
  get: RoleController.getAll,
  getWithParam: [[':id', RoleController.getOne]],
  wrapperRequest,
})

module.exports = router
