import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../auth/authConfig';
import { useAppDispatch } from '../../context/AppContext';
import iusLogo from '../../data/IUS_Official_Logo.png';

export function LoginView() {
  const dispatch = useAppDispatch();
  const { instance } = useMsal();

  const handleLogin = () => {
    dispatch({ type: 'LOGOUT' });
    instance.loginRedirect(loginRequest);
  };

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

        <div className="login-cards login-cards-single">
          <article className="login-card login-card-wide">
            <div className="login-card-avatar">MS</div>
            <div className="login-card-body">
              <span className="login-card-role">Microsoft Entra ID</span>
              <strong className="login-card-name">Sign in with your university account</strong>
              <p className="login-card-desc">
                Your session is handled by Microsoft, and API access tokens stay in session storage.
              </p>
            </div>
            <button type="button" className="login-card-btn" onClick={handleLogin}>
              Sign in
            </button>
          </article>
        </div>

        <p className="login-note">Use the same account that was granted access to the SCMS API.</p>
      </div>
    </div>
  );
}
