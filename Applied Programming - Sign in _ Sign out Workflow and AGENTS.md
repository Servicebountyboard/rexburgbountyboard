# **AGENTS.md**

## **Project Overview**

This project is a TypeScript-based mobile sign-in/sign-out platform connected to a Supabase database and authentication services.

The application must allow users to:

* Sign in with a username, email address, and password.

* Sign out securely.

* Validate account credentials against the application's authentication system.

* Recover a forgotten username or password using email verification.

* Sign in using an authorized Google account.

* Sign in using a valid Apple ID.

* Save credentials using the mobile device's secure credential/password storage when supported.

* Receive clear and useful error messages when authentication fails.

The application should prioritize security, readability, maintainability, accessibility, and a simple user experience.

---

## **Technology Requirements**

### **Language**

* Use **TypeScript** for application code.

* Prefer explicit types over implicit `any`.

* Avoid `any` unless there is a documented and unavoidable reason.

* Use interfaces and types to clearly describe application data.

### **Database and Authentication**

* Use **Supabase** as the backend database/authentication platform.

* Authentication-related operations should go through Supabase's supported authentication APIs.

* Never store plaintext passwords in the application's database.

* Never log passwords, authentication tokens, verification codes, or other sensitive credentials.

* Do not implement custom password hashing when Supabase Auth can perform authentication securely.

### **External Authentication**

Support:

* Google authentication.

* Apple authentication.

OAuth/provider authentication should be handled through Supabase Auth and the appropriate provider configuration rather than manually processing provider passwords.

---

## **Project Architecture**

Keep responsibilities separated.

A recommended structure is:

src/  
├── components/          \# Reusable UI components  
├── screens/             \# Sign-in, recovery, and account screens  
├── services/            \# Supabase and authentication services  
├── auth/                \# Authentication-specific logic  
├── types/               \# Shared TypeScript types/interfaces  
├── utils/                \# Small reusable utility functions  
├── config/               \# Application configuration  
└── navigation/           \# Application navigation

The exact structure may change as the project grows, but business logic should not be mixed unnecessarily with UI code.

### **Separation of Responsibilities**

* **Screens/components** should handle presentation and user interaction.

* **Authentication services** should handle authentication requests.

* **Validation utilities** should handle input validation.

* **Supabase services** should handle communication with Supabase.

* **Types** should describe shared data structures.

* **Navigation** should determine which screen the user should see.

* Avoid putting large amounts of business logic directly inside UI components.

---

## **Authentication Requirements**

### **Standard Sign-In**

The sign-in screen should allow the user to provide:

1. Username or email address.

2. Password.

If the application requires all three values—username, email, and password—those fields must be validated before attempting authentication.

The general flow is:

User enters credentials  
        |  
        v  
Validate input format  
        |  
        v  
Send authentication request  
        |  
        v  
Supabase validates credentials  
      /     \\  
   Valid    Invalid  
    |          |  
    v          v  
 Sign in    Show error

### **Invalid Credentials**

If authentication fails:

* Do not allow the user into the authenticated portion of the application.

* Display a clear error message.

* Allow the user to try again.

* Do not reveal sensitive information unnecessarily.

* Do not display passwords or authentication tokens in error messages.

Prefer a message such as:

> We couldn't sign you in with those credentials. Please check your information and try again.

Avoid unnecessarily revealing whether a particular account exists, because account-enumeration protection is important for authentication systems.

---

## **Input Validation**

Validate user input before sending it to Supabase.

Validation should include:

* Required-field checks.

* Email format validation where an email is required.

* Password requirements.

* Reasonable username requirements.

* Whitespace handling.

* Appropriate input length limits.

Client-side validation improves the user experience, but it must **not** be treated as the application's security boundary.

The server/authentication system must still validate authentication requests.

---

## **Password Security**

Passwords are sensitive information.

Never:

* Store plaintext passwords.

* Log passwords.

* Include passwords in analytics events.

* Put passwords into URLs.

* Display passwords in normal application logs.

* Send passwords to an unnecessary third-party service.

When password storage on the device is supported, use the platform's secure credential storage mechanism rather than ordinary local storage.

Examples of secure approaches may include:

* iOS Keychain.

* Android Keystore-backed credential storage.

* A secure credential manager provided by the selected mobile framework.

Do not store passwords in:

localStorage  
AsyncStorage  
plain JSON files  
ordinary SQLite fields  
unencrypted preferences

unless the platform's secure storage system explicitly protects the data.

---

## **Username and Password Recovery**

The application must provide a recovery option.

Recommended flow:

User selects "Forgot password?"  
              |  
              v  
       Enter account email  
              |  
              v  
       Validate email input  
              |  
              v  
     Request recovery email  
              |  
              v  
       User receives email  
              |  
              v  
       User verifies identity  
              |  
              v  
       Reset credentials  
              |  
              v  
       Return to sign-in

The recovery system should:

* Send the recovery message through Supabase-supported authentication functionality.

* Use the email associated with the account.

* Avoid exposing whether an email belongs to an account.

* Allow the user to create a new password after successful verification.

* Provide useful error handling.

* Expire or invalidate recovery tokens according to the authentication provider's security mechanisms.

If username recovery is required, use a verified email-based recovery flow rather than exposing account information unnecessarily.

---

## **Google Sign-In**

The application should provide a clearly labeled option such as:

Continue with Google

The authentication flow should use Supabase Auth's Google provider integration.

The application should:

1. Start the Google authentication flow.

2. Allow Google to authenticate the user.

3. Return the authentication result through the configured redirect/deep-link flow.

4. Establish the authenticated Supabase session.

5. Navigate the user into the authenticated application.

Do not ask users to provide their Google password directly to this application.

---

## **Apple Sign-In**

The application should provide a clearly labeled option such as:

Continue with Apple

The authentication flow should use Apple's supported authentication mechanism through Supabase Auth.

Do not ask users to provide their Apple ID password directly to this application.

---

## **Sign-Out**

The sign-out process should:

1. Ask the authentication service to terminate the current session.

2. Clear application authentication state.

3. Return the user to the sign-in screen.

4. Prevent access to authenticated screens after the session has ended.

Do not merely navigate the user back to the sign-in screen while leaving an active authentication session.

---

## **Session Management**

Authentication state should have a single authoritative source.

Avoid maintaining multiple competing copies of authentication state.

The application should respond appropriately when:

* A session is created.

* A session expires.

* A user signs out.

* A token is refreshed.

* Authentication fails.

* The application starts with an existing session.

---

## **Error Handling**

Authentication errors should be handled intentionally.

Do not allow raw backend errors to become the application's user interface.

Instead:

Supabase error  
      |  
      v  
Authentication service  
      |  
      v  
Translate into application error  
      |  
      v  
User-friendly message

Errors should be:

* Clear.

* Actionable.

* Safe.

* Consistent across screens.

Developers may retain more detailed diagnostic information in secure development logs, but sensitive authentication information must never be logged.

---

## **Comments and Documentation**

The project specifically requires extensive documentation.

Code should contain comments explaining:

* What important functions do.

* Why a particular approach was chosen.

* How authentication flows work.

* Why security-sensitive code exists.

* Important assumptions.

* Non-obvious Supabase behavior.

* Important platform-specific behavior.

Prefer useful comments such as:

// Start the Supabase authentication flow instead of handling  
// the provider's password directly. The provider is responsible  
// for authenticating the user, while Supabase establishes the  
// application session after authentication succeeds.

Avoid comments that merely repeat the code:

// Set user to user.  
const user \= user;

Comments should explain **why**, not just **what**.

---

## **TypeScript Rules**

Use strong typing throughout the project.

Prefer:

interface SignInRequest {  
  email: string;  
  password: string;  
}

over:

const request: any \= {};

Use:

* Interfaces for structured application objects when appropriate.

* Union types for finite states.

* Explicit return types for important functions.

* Type-safe service boundaries.

* Strict null/undefined handling.

Avoid unnecessary type assertions:

const user \= data as User;

Prefer validating or correctly typing the source data.

---

## **Code Quality Rules**

### **Readability**

Code must be understandable to developers who are not experts in TypeScript.

Prefer:

const isValidEmail \= validateEmail(email);

over overly compressed expressions that require extensive knowledge of the language.

Use descriptive names.

Good:

authenticateUser  
sendPasswordResetEmail  
validateSignInForm  
handleAuthenticationError

Avoid:

auth  
doIt  
x  
tmp  
thing

unless the variable is genuinely trivial and local.

### **Avoid Duplicate Logic**

Do not copy authentication logic between screens.

If several screens need the same behavior, move that behavior into a shared service or utility.

For example:

SignInScreen  
      |  
      v  
AuthenticationService  
      |  
      v  
Supabase

instead of:

SignInScreen \--------\> Supabase  
RecoveryScreen \------\> Supabase  
AccountScreen \--------\> Supabase

when the same authentication logic is duplicated in each screen.

### **Avoid Spaghetti Code**

Avoid:

* Deeply nested conditionals.

* Huge functions.

* Circular dependencies.

* UI components that contain all business logic.

* Repeated Supabase calls.

* Global mutable state without a clear reason.

* Authentication logic scattered throughout unrelated components.

Break complex operations into small, named functions.

---

## **UI/UX Requirements**

The sign-in screen should clearly provide:

* Username/email input.

* Password input.

* Sign-in button.

* Password recovery option.

* Google sign-in option.

* Apple sign-in option.

The user should always understand:

* What information is required.

* Whether authentication is being processed.

* Whether authentication succeeded.

* What they should do after an error.

Disable or otherwise protect the sign-in action while a request is actively processing to prevent accidental duplicate requests.

---

## **Security Principles**

Security takes priority over convenience when the two conflict.

Never commit:

* Supabase service-role keys.

* Private API keys.

* OAuth client secrets.

* Passwords.

* Recovery tokens.

* Authentication tokens.

* Other secrets.

Public client configuration must be distinguished from server-side secrets.

Environment variables and platform-appropriate secret management should be used for configuration.

---

## **Testing Requirements**

Authentication code should have tests for at least:

* Valid sign-in.

* Invalid password.

* Invalid email.

* Missing required fields.

* Password recovery.

* Expired/invalid recovery flow.

* Successful Google authentication.

* Failed Google authentication.

* Successful Apple authentication.

* Failed Apple authentication.

* Sign-out.

* Expired sessions.

* Authentication service errors.

Tests should not use real user passwords or production credentials.

---

## **Development Workflow**

When adding a feature:

1. Understand the existing authentication architecture.

2. Identify whether reusable logic already exists.

3. Add or update TypeScript types.

4. Implement business logic in the appropriate service.

5. Connect the service to the UI.

6. Add clear error handling.

7. Add comments for non-obvious behavior.

8. Test success and failure cases.

9. Review the code for duplication.

10. Review the code for security issues.

11. Confirm that secrets have not been committed.

12. Keep the final implementation readable.

---

## **Definition of Done**

A feature is not complete until:

* It is implemented in TypeScript.

* It follows the project's architecture.

* It has appropriate type definitions.

* Authentication behavior is secure.

* Errors are handled gracefully.

* Sensitive information is protected.

* Duplicate logic has been avoided.

* The code contains useful documentation.

* Relevant tests have been added or updated.

* The implementation is readable to another developer.

---

## **Primary Design Principle**

**Keep authentication secure, centralized, typed, documented, and easy to understand.**

When choosing between a complicated implementation and a simpler implementation that meets the same requirements securely, prefer the simpler implementation.

