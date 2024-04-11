function checkAuthentication() {
    return fetch('/is-authenticated') // return the promise chain
    .then(response => response.json())
    .then(data => {
        const messageElement = document.getElementById('message');
        if (data.isAuthenticated) {
          localStorage.setItem('userEmail', data.email);
            // User is authenticated, show the "Enroll" button and success message
            if (!document.querySelector('#enrollButton')) {
                const enrollButton = document.createElement('button');
                enrollButton.id = 'enrollButton';
                enrollButton.innerText = 'Enroll in AuthFlow';
                enrollButton.onclick = promptEnrollment;
                const containerDiv = document.querySelector('.container'); // Select the container div
                containerDiv.appendChild(enrollButton); // Append the button to the container div if it doesn't exist
            }
            messageElement.innerText = 'You are authenticated.';
            messageElement.style.color = 'green';
        } 
    }); 
}


function promptEnrollment() {
    const enroll = confirm("Do you want to enroll in AuthFlow Authenticator?");
    if (enroll) {
      // Show the security questions form
      document.getElementById('securityQuestionsForm').style.display = 'block';
    }
}

// Mock fetch and localStorage
global.fetch = jest.fn();
global.localStorage = {
  setItem: jest.fn()
};

// Helper function to mock fetch responses
function mockFetch(data) {
  fetch.mockImplementationOnce(() => Promise.resolve({
    json: () => Promise.resolve(data),
  }));
}

describe('checkAuthentication', () => {
    beforeEach(() => {
        // Clear the mocks
        fetch.mockClear();
        jest.clearAllMocks(); // This will clear all Jest mocks
    
        // Mock global.fetch
        global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
            json: () => Promise.resolve({ isAuthenticated: true, email: 'user@example.com' }),
        }));

        // Mock localStorage.setItem
        global.localStorage.setItem = jest.fn();

        // Mock localStorage.getItem
        const localStorageMock = (function() {
            let store = {};
            return {
                getItem: function(key) {
                    return store[key];
                },
                setItem: function(key, value) {
                    store[key] = value.toString();
                },
                clear: function() {
                    store = {};
                }
            };
        })();
    
        // Assign our mock to the global object
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock
        });
    
        // Setup the initial DOM structure
        document.body.innerHTML = `
            <div id="message"></div>
            <div class="container"></div>
        `;
    });

  test('should not create enroll button if it already exists', async () => {
    document.body.innerHTML = `<div id="message"></div><div class="container"><button id="enrollButton"></button></div>`;
    const userData = { isAuthenticated: true, email: 'user@example.com' };
    mockFetch(userData);

    await checkAuthentication();

    expect(document.querySelectorAll('#enrollButton').length).toBe(1);
  });

    test('should create enroll button if it does not exist', async () => {
        const userData = { isAuthenticated: true, email: 'user@example.com' };
        mockFetch(userData);

        await checkAuthentication();

        const enrollButton = document.getElementById('enrollButton');
        expect(enrollButton).toBeTruthy();
        expect(enrollButton.innerText).toBe('Enroll in AuthFlow');
    });
});


describe('promptEnrollment', () => {
    let confirmSpy;
    let getElementByIdSpy;

    beforeEach(() => {
        // Spy on the confirm method
        confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        
        // Spy on getElementById method
        getElementByIdSpy = jest.spyOn(document, 'getElementById').mockReturnValue({
            style: {
                display: ''
            }
        });
    });

    afterEach(() => {
        // Restore the original methods after each test
        confirmSpy.mockRestore();
        getElementByIdSpy.mockRestore();
    });

    test('should show the security questions form if user confirms enrollment', () => {
        // Call the function
        promptEnrollment();

        // Expect confirm method to have been called
        expect(confirmSpy).toHaveBeenCalled();

        // Expect getElementById method to have been called with the correct argument
        expect(getElementByIdSpy).toHaveBeenCalledWith('securityQuestionsForm');

        // Expect style.display of the form to be 'block'
        expect(document.getElementById('securityQuestionsForm').style.display).toBe('block');
    });

    test('should not show the security questions form if user cancels enrollment', () => {
        // Mock confirm method to return false
        confirmSpy.mockReturnValue(false);

        // Call the function
        promptEnrollment();

        // Expect confirm method to have been called
        expect(confirmSpy).toHaveBeenCalled();

        // Expect getElementById method not to have been called
        expect(getElementByIdSpy).not.toHaveBeenCalled();

        // Expect style.display of the form not to be 'block'
        expect(document.getElementById('securityQuestionsForm').style.display).not.toBe('block');
    });
});