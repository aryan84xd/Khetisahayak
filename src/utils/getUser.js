import supabase from './superbaseClient';

// Utility function to authenticate with Google
export const getUser = async () => {
  const { user, session, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (error) {
    console.error('Error during Google sign-in:', error);
    return null;
  }

  // You can return the user and session info, or customize as needed
  return {
    user,
    session,
  };
};

// Logout function
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error during logout:', error);
  }
};
