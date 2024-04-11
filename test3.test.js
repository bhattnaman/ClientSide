function verifyPasskey() {

    // Get the user's email and passkey from the input fields on the page
    const email = localStorage.getItem('userEmail');
    const passkey = document.getElementById('passkeyInput').value;

    // Now make the request to the Authenticator server with the user's email and passkey
    fetch('/verify-passkey', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, passkey }),
    })
    .then(response => response.json())
    .then(data => {
        const messageElement = document.getElementById('message');
        messageElement.innerText = `${data.message}`;
        messageElement.style.color = 'green'; // Success message in green
       // Redirect to profile page if passkey is verified
        window.location.href = '/profile-page';
    })
}

import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Mocking localStorage
const mockLocalStorage = (function() {
    let store = {};
    return {
        getItem: function(key) {
            return store[key] || null;
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        clear: function() {
            store = {};
        }
    };
})();

// Mocking document.getElementById
const mockGetElementById = jest.fn();

// Setup fetch mock
global.fetch = require('jest-fetch-mock');
fetchMock.enableMocks();

beforeEach(() => {
    fetch.resetMocks();
    document.getElementById = mockGetElementById;
    global.localStorage = mockLocalStorage;
    global.window = Object.create(window);
    const url = "http://dummy.com";
    Object.defineProperty(window, 'location', {
        value: {
            href: url
        },
        writable: true
    });
});

describe('verifyPasskey', () => {
    it('successfully verifies passkey and redirects', async () => {
        // Setup
        localStorage.setItem('userEmail', 'user@example.com');
        fetch.mockResponseOnce(JSON.stringify({ message: "Passkey verified" }));

        const mockInput = { value: 'passkey123' };
        const mockMessageElement = { innerText: '', style: { color: '' } };
        mockGetElementById.mockImplementation((id) => {
            if (id === 'passkeyInput') return mockInput;
            if (id === 'message') return mockMessageElement;
        });

        // Action
        verifyPasskey();

        // Assertions
        await new Promise(process.nextTick); // Wait for promises to resolve
        expect(fetch).toHaveBeenCalledWith('/verify-passkey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'user@example.com', passkey: 'passkey123' }),
        });
        expect(mockMessageElement.innerText).toBe("Passkey verified");
        expect(mockMessageElement.style.color).toBe('green');
        expect(window.location.href).toBe('/profile-page');
    });

    // Additional tests could be written for failure cases, incorrect passkey, etc.
    it('handles passkey verification failure', async () => {
        // Setup
        localStorage.setItem('userEmail', 'user@example.com');
        fetch.mockResponseOnce(JSON.stringify({ message: "Passkey incorrect" }));

        const mockInput = { value: 'incorrectpasskey' };
        const mockMessageElement = { innerText: '', style: { color: '' } };
        mockGetElementById.mockImplementation((id) => {
            if (id === 'passkeyInput') return mockInput;
            if (id === 'message') return mockMessageElement;
        });

        // Action
        verifyPasskey();

        // Assertions
        await new Promise(process.nextTick); // Wait for promises to resolve
        expect(fetch).toHaveBeenCalledWith('/verify-passkey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: 'user@example.com', passkey: 'incorrectpasskey' }),
        });
        expect(mockMessageElement.innerText).toBe("Passkey incorrect");
        expect(mockMessageElement.style.color).toBe('green');
        expect(window.location.href).toBe('/profile-page');
    });
});
