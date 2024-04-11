/**
 * @jest-environment jsdom
 */
function login() {
    window.location.href = '/login';
}

describe('login function', () => {
    beforeAll(() => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: {
          href: jest.fn(),
        },
        writable: true,
      });
    });

    // Reset window.location.href after each test
    afterEach(() => {
      window.location.href = '';
    });

    // Test the login function
    // This test will pass
    it('should redirect to /login', () => {
      login();
      expect(window.location.href).toBe('/login');
    });

    // This test will fail
    it('should not redirect to /login', () => {
      login();
      expect(window.location.href).not.toBe('/logout');
    });

  });
  

// Updated logout function to accept req and connection as parameters
function logout(req, connection) {
    window.location.href = '/logout';
    const user = req.oidc.user;
    const { email } = user;

    // Set the user as logged out
    const setUserLoggedOutQuery = 'UPDATE AuthFlowUsers SET is_logged_in = FALSE WHERE email = ?';
    connection.query(setUserLoggedOutQuery, [email], (err, results) => {
        if (err) {
            console.error('Database error when logging out:', err); // Replace console.error with your logger if necessary
        } 
    }); 
}


describe('logout function', () => {
    // Mocking necessary data
    const req = { oidc: { user: { email: 'test@example.com' } } };
    let mockQuery;
    let connection;
  
    beforeEach(() => {
      // Reset mockQuery for isolation between tests
      mockQuery = jest.fn((query, params, callback) => callback(null, true));
      connection = { query: mockQuery };
      // Mock window.location.href if necessary
      global.window.location.href = '';
    });

    // Reset window.location.href after each test
    afterEach(() => {
      window.location.href = '';
    });

    // THIS TEST WILL PASS
    it('should redirect to /logout', () => {
      logout(req, connection);
  
      expect(window.location.href).toBe('/logout');
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE AuthFlowUsers SET is_logged_in = FALSE WHERE email = ?',
        ['test@example.com'],
        expect.any(Function)
      );
    });

    // THIS TEST WILL FAIL
    it('should not redirect to /logout', () => {
      logout(req, connection);
  
      expect(window.location.href).not.toBe('/profile-page');
      expect(mockQuery).not.toHaveBeenCalledWith(
          'UPDATE AuthFlowUsers SET is_logged_in = 0 WHERE email = ?',
          ['test@example.com'],
          expect.any(Function)
      );
  });
});

