import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAccount } from '../store/accountSlice';
import PropTypes from 'prop-types';

const AuthGuard = ({ children, requireAuth = true }) => {
  const navigate = useNavigate();
  const account = useSelector(getAccount);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        // Check if user has valid account data
        const hasValidAccount = account && account.walletAddress && account.seedPhrase;
        
        // Check if user has explicitly logged out
        const lastLogoutTime = localStorage.getItem('lastLogoutTime');
        const accountTimestamp = account?.timestamp || 0;
        
        const hasLoggedOut = lastLogoutTime && new Date(accountTimestamp) <= new Date(lastLogoutTime);
        
        if (hasValidAccount && !hasLoggedOut) {
          setIsAuthenticated(true);
          // Clear logout timestamp since user is now authenticated
          localStorage.removeItem('lastLogoutTime');
        } else {
          setIsAuthenticated(false);
          // Clear any stale data
          if (hasLoggedOut) {
            localStorage.removeItem('account');
          }
        }
      } catch (error) {
        console.error('❌ Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [account]);

  useEffect(() => {
    if (!isChecking) {
      if (requireAuth && !isAuthenticated) {
        // User needs to be authenticated but isn't - redirect to wallet options
        console.log('🚫 Authentication required, redirecting to wallet options');
        navigate('/', { replace: true });
      } else if (!requireAuth && isAuthenticated) {
        // User is authenticated but shouldn't be on this page - redirect to dashboard
        console.log('✅ User authenticated, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isChecking, isAuthenticated, requireAuth, navigate]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authentication requirements are met, render children
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return children;
  }

  // This should not be reached due to the useEffect above, but just in case
  return null;
};

export default AuthGuard;

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
  requireAuth: PropTypes.bool
};
