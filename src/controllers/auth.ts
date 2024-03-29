import { RequestHandler } from 'express'

import { SignInData } from '~/models/auth'
import { AuthRepository, AuthRepositoryErrors } from '~/repository/auth'
import { ManagersRepositoryErrors } from '~/repository/managers'
import { WorkersRepositoryErrors } from '~/repository/workers'

export type SignInController = (repo: AuthRepository) => RequestHandler
export const signinController: SignInController =
  (repo: AuthRepository): RequestHandler =>
  async (req, res) => {
    try {
      const token = await repo.signin(req.body as SignInData)
      res.setHeader('X-AuthToken', token)
      res.status(200).end()
    } catch (error) {
      switch (error) {
        case WorkersRepositoryErrors.NotFound:
        case ManagersRepositoryErrors.NotFound:
        case AuthRepositoryErrors.InvalidCredentials:
          res
            .status(401)
            .json({ error: AuthRepositoryErrors.InvalidCredentials })
          break
        case AuthRepositoryErrors.UnknownUserType:
          res.status(400).json({ error })
          break
        default:
          res.status(500).end()
      }
    }
  }
