import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/authService'
import { validateRegister } from '../validation/authValidation'
import { useAudio } from '../contexts/AudioContext'

export function RegisterPage() {
  const { stopAndClearAudio } = useAudio()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
    form?: string
  }>({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    stopAndClearAudio()
  }, [stopAndClearAudio])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})
    setSuccess('')

    const validationErrors = validateRegister({ username, email, password, confirmPassword })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {
      await registerUser({ username, email, password })
      navigate('/')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Registration failed.'
      setErrors({ form: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Register</h1>
        <p className="auth-subtitle">Create your account and start using the app.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. lucia_music"
              minLength={3}
              maxLength={50}
              required
            />
            {errors.username ? <p className="message error">{errors.username}</p> : null}
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              required
            />
            {errors.email ? <p className="message error">{errors.email}</p> : null}
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-input">
              <input
                type={passwordVisible ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              >
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password ? <p className="message error">{errors.password}</p> : null}
          </label>

          <label className="field">
            <span>Repeat password</span>
            <div className="password-input">
              <input
                type={confirmPasswordVisible ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="visibility-toggle"
                onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                aria-label={confirmPasswordVisible ? 'Hide repeated password' : 'Show repeated password'}
              >
                {confirmPasswordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword ? <p className="message error">{errors.confirmPassword}</p> : null}
          </label>

          {errors.form ? <p className="message error">{errors.form}</p> : null}
          {success ? <p className="message success">{success}</p> : null}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  )
}
