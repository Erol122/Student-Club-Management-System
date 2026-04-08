import { useAppDispatch } from '../../context/AppContext';
import { LOGIN_USERS } from '../../data/mockData';

export function LoginView() {
  const dispatch = useAppDispatch();

  return (
    <div className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="login-frame">
        <div className="login-header">
          <div className="brand-mark" style={{ margin: '0 auto 20px' }}>IUS</div>
          <h1 className="login-title">Student Organizations</h1>
          <p className="login-subtitle">Choose a role to sign in and explore the platform.</p>
        </div>

        <div className="login-cards">
          {LOGIN_USERS.map((user) => (
            <article key={user.role} className="login-card">
              <div className="login-card-avatar" style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}cc)` }}>
                {user.avatar}
              </div>
              <div className="login-card-body">
                <span className="login-card-role">{user.role}</span>
                <strong className="login-card-name">{user.name}</strong>
                <p className="login-card-desc">{user.description}</p>
              </div>
              <button
                type="button"
                className="login-card-btn"
                style={{ '--btn-color': user.color }}
                onClick={() => dispatch({ type: 'LOGIN', payload: user })}
              >
                Sign in as {user.role}
              </button>
            </article>
          ))}
        </div>

        <p className="login-note">This is a demo platform. No real data is stored or transmitted.</p>
      </div>
    </div>
  );
}
