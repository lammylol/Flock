// __mocks__/hooks/useAuth.ts
import { auth } from '../firebase/auth';

export default jest.fn().mockReturnValue({
  user: auth.currentUser,
  loading: false,
  error: null,
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
});
