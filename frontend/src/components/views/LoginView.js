import { useAppDispatch } from '../../context/AppContext';
import { LOGIN_USERS } from '../../data/mockData';
import iusLogo from '../../data/IUS_Official_Logo.png';

export function LoginView() {
  const dispatch = useAppDispatch();

  return (
    <div className="login-page">
      <div className="login-frame">
        <div className="login-header">
          <img className="login-logo-image" src={iusLogo} alt="IUS logo" />
          <h1 className="login-title">Student Clubs Hub</h1>
          <p className="login-subtitle">
            A clean and simple way for students to create clubs, manage activities, and coordinate
            members.
          </p>
        </div>

        <div className="login-cards">
          {LOGIN_USERS.map((user) => (
            <article key={user.role} className="login-card">
              <div
                className="login-card-avatar"
                style={{ background: `linear-gradient(150deg, ${user.color}, #1a2642)` }}
              >
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
                onClick={() => dispatch({ type: 'LOGIN', payload: user })}
              >
                Continue as {user.role}
              </button>
            </article>
          ))}
        </div>

        <p className="login-note">Demo mode. Data is local to this session.</p>
      </div>
    </div>
  );
}
