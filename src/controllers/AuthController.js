import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import passport from 'passport'
import 'dotenv/config'
import models from '../models'
import { ROLE } from '../config/constants'
import { getToken, getUniqueCodev2, validationRequest } from '../helper'

require('../config/passport')(passport)

const jwtPass = process.env.JWT_SECRET
// declare models
const { User, Role } = models

async function signUp({ req, ResponseError }) {
  const { body } = req
  const { fullName, email, password, phone } = body

  const generateToken = {
    code: getUniqueCodev2(),
  }

  const tokenVerify = jwt.sign(JSON.parse(JSON.stringify(generateToken)), jwtPass, {
    expiresIn: 86400 * 1,
  }) // 1 Days

  const ObjUser = {
    fullName,
    email,
    password,
    phone,
    RoleId: ROLE.UMUM,
    tokenVerify,
  }

  const userData = await User.create(ObjUser)
  return { userData, message: 'Registrasi berhasil, Check email Anda untuk langkah selanjutnya!' }
}

async function signIn({ req, ResponseError }) {
  const { body } = req
  const { email, password } = body

  const including = [{ model: Role }]
  const condition = { email }

  const userData = await User.findOne({
    include: including,
    where: condition,
  })

  if (!userData) {
    throw new ResponseError('Data tidak ditemukan!', 404)
  }

  if (userData.active === true) {
    const checkPassword = await userData.comparePassword(password)
    if (checkPassword) {
      const token = jwt.sign(JSON.parse(JSON.stringify(userData)), jwtPass, {
        expiresIn: 86400 * 1,
      }) // 1 Days
      return {
        token: `JWT ${token}`,
        uid: userData.id,
        rid: userData.RoleId,
      }
    }
    // console.log(res)
    throw new ResponseError('Email atau Password salah!', 401)
  } else {
    throw new ResponseError(
      'Please check your email account to verify your email and continue the registration process.',
      401
    )
  }
}

async function getProfile({ req, ResponseError }) {
  const { headers } = req
  const token = getToken(headers)
  if (token) {
    return jwt.decode(token)
  }

  throw new ResponseError('Unauthorized. Please Re-login...', 403)
}

async function changePass({ req, ResponseError }) {
  const { headers, body, params } = req
  const token = getToken(headers)
  const { id } = params
  const { currentPassword, password } = body

  if (token) {
    await validationRequest(body)

    const editData = await User.findById(id)
    if (!editData) {
      throw new ResponseError('Data tidak ditemukan!', 404)
    }

    if (bcrypt.compareSync(currentPassword, editData.password)) {
      const hashPassword = bcrypt.hashSync(password, 10)
      await editData.updateOne({
        password: hashPassword,
      })
    } else {
      throw new ResponseError('Password lama kamu salah!', 400)
    }

    return {
      message: 'Data berhasil diperbarui!',
      editData,
    }
  }

  throw new ResponseError('Unauthorized. Please Re-login...', 403)
}

export { signUp, signIn, getProfile, changePass }
