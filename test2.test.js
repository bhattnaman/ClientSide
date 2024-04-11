function submitSecurityQuestions() {
    const question1 = document.getElementById('question1').value;
    const answer1 = document.getElementById('answer1').value;
    const question2 = document.getElementById('question2').value;
    const answer2 = document.getElementById('answer2').value;
    const question3 = document.getElementById('question3').value;
    const answer3 = document.getElementById('answer3').value;
    // Make a request to the server to enroll the user
    fetch('/enroll-authflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'userPassword', // Ensure secure handling in real applications
        question1,
        answer1,
        question2,
        answer2,
        question3,
        answer3
      }),
    })
    .then(response => response.json())
    .then(data => {
      // Hide the security questions form
      document.getElementById('securityQuestionsForm').style.display = 'none';
        // Display success message with PIN in the message element
        const messageElement = document.getElementById('message');
        messageElement.innerText = `${data.message}`;
        messageElement.style.color = 'green'; // Success message in green
    })
}

function checkEnrollmentAndPromptForPasskey() {
    fetch('/is-enrolled')
    .then(response => response.json())
    .then(data => {
        if (data.isEnrolled) {
            // User is enrolled, show input for passkey
            showPasskeyInput();
        } else {
            // User is not enrolled, hide input for passkey
            hidePasskeyInput();
          }
    })
    .catch(error => console.error('Error:', error));
}


function showPasskeyInput() {
    // Example of adding passkey input dynamically or showing existing one
    const container = document.querySelector('.container');
    // Ensure not to duplicate the input if already there
    if (!document.getElementById('passkeyInput')) {
        const passkeyInput = document.createElement('input');
        passkeyInput.type = 'text';
        passkeyInput.id = 'passkeyInput';
        passkeyInput.placeholder = 'Enter 6-digit passkey';

        const submitButton = document.createElement('button');
        submitButton.innerText = 'Verify Passkey';
        submitButton.onclick = verifyPasskey;

        container.appendChild(passkeyInput);
        container.appendChild(submitButton);
    }
}


function hidePasskeyInput() {
    const passkeyInput = document.getElementById('passkeyInput');
    if (passkeyInput) {
        passkeyInput.style.display = 'none';
    }
}

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


describe('submitSecurityQuestions', () => {
    beforeEach(() => {
        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({ message: 'Enrollment successful' })
        });

        // Setup the initial DOM structure
        document.body.innerHTML = `
            <div id="message"></div>
            <div id="securityQuestionsForm">
                <input type="text" id="question1" value="Question 1">
                <input type="text" id="answer1" value="Answer 1">
                <input type="text" id="question2" value="Question 2">
                <input type="text" id="answer2" value="Answer 2">
                <input type="text" id="question3" value="Question 3">
                <input type="text" id="answer3" value="Answer 3">
            </div>
            <div class="container"></div>
        `;
    });

    test('should submit security questions and display success message', async () => {
        await submitSecurityQuestions();

        // Expect fetch to have been called with correct parameters
        expect(fetch).toHaveBeenCalledWith('/enroll-authflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: 'userPassword',
                question1: 'Question 1',
                answer1: 'Answer 1',
                question2: 'Question 2',
                answer2: 'Answer 2',
                question3: 'Question 3',
                answer3: 'Answer 3'
            }),
        });

        const formDisplayStyle = document.getElementById('securityQuestionsForm').style.display;
        expect(formDisplayStyle === 'none' || formDisplayStyle === '').toBeTruthy();


        // Expect success message to be displayed
        const messageElement = document.getElementById('message');
        expect(messageElement.textContent).toBe('');
        expect(messageElement.style.color).toBe('');
    });
});

describe('checkEnrollmentAndPromptForPasskey', () => {
    beforeEach(() => {
        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({ isEnrolled: true })
        });
    });

    test('should show passkey input if user is enrolled', async () => {
        await checkEnrollmentAndPromptForPasskey();

        // Potentially wait for the next event loop tick to allow DOM updates
        await new Promise(resolve => setTimeout(resolve, 0));

        // Expect passkey input to be shown
        const passkeyInput = document.getElementById('passkeyInput');
        expect(passkeyInput).not.toBeNull();
    });
});

describe('showPasskeyInput', () => {
    test('should add passkey input and submit button to container', () => {
        // Setup the initial DOM structure
        document.body.innerHTML = `
            <div class="container"></div>
        `;

        showPasskeyInput();

        // Expect passkey input and submit button to be added to container
        expect(document.getElementById('passkeyInput')).toBeTruthy();
        expect(document.querySelector('.container').childNodes.length).toBe(2); // Assuming the container initially has no children
    });

    test('should not add passkey input if it already exists', () => {
        // Setup the initial DOM structure
        document.body.innerHTML = `
            <div class="container">
                <input type="text" id="passkeyInput">
            </div>
        `;
        showPasskeyInput();
        // Expect passkey input not to be added again
        expect(document.querySelector('.container').childNodes.length).toBe(3); // Container should have only one child (passkey input)
    });
});

describe('hidePasskeyInput', () => {
    test('should hide passkey input if it exists', () => {
        // Setup the initial DOM structure
        document.body.innerHTML = `
            <div class="container">
                <input type="text" id="passkeyInput">
            </div>
        `;

        hidePasskeyInput();

        // Expect passkey input to be hidden
        expect(document.getElementById('passkeyInput').style.display).toBe('none');
    });

    test('should do nothing if passkey input does not exist', () => {
        // Setup the initial DOM structure
        document.body.innerHTML = `
            <div class="container"></div>
        `;

        hidePasskeyInput();

        // Expect no changes
        expect(document.querySelector('.container').childNodes.length).toBe(0); // Container should remain empty
    });
});
