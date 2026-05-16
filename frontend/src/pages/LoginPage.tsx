import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { validateLogin } from '../validation/authValidation'
import { useAudio } from '../contexts/AudioContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { stopAndClearAudio } = useAudio()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    stopAndClearAudio()
  }, [stopAndClearAudio])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})
    setSuccess('')

    const validationErrors = validateLogin({ email, password })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    try {
      const response = await loginUser({ email, password })
      setSuccess(`Welcome ${response.user.username}, login completed successfully.`)
      navigate('/')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Login failed.'
      setErrors({ form: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Login</h1>
        <p className="auth-subtitle">Enter your email and password to continue.</p>

        <form className="auth-form" onSubmit={onSubmit}>
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
                placeholder="Your password"
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

          {errors.form ? <p className="message error">{errors.form}</p> : null}
          {success ? <p className="message success">{success}</p> : null}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  )
}
