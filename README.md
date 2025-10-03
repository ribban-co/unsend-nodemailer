# Unsend Nodemailer

> NPM package allowing you to send emails easily with the Unsend API. 

### How to get started

#### 1. Install the package

```bash
npm install @ribban/unsend-nodemailer
```

### Usage

#### Create Nodemailer Transport

```typescript
import { UnsendTransport } from '@ribban/unsend-nodemailer';
import { createTransport } from 'nodemailer';

const mailer = createTransport(
  UnsendTransport.makeTransport({
    apiKey: YOUR_UNSEND_API_KEY
  })
);
```

#### Custom API Endpoint (Optional)

If you need to use a custom Unsend API endpoint (e.g., self-hosted instance):

```typescript
const mailer = createTransport(
  UnsendTransport.makeTransport({
    apiKey: YOUR_UNSEND_API_KEY,
    apiUrl: 'https://your-custom-endpoint.com'  // Default is 'https://api.unsend.dev'
  })
);
```

#### Send an Email

```typescript
mailer.sendMail({
  from: 'hej@ribban.co',
  to: 'hej@sajn.se',
  subject: 'This is a example email!',
  html: '<h1>Enter your HTML content here!</h1>',
});
```

#### Specifying Sender Name

You can include a display name with the email address:

```typescript
mailer.sendMail({
  from: 'RIBBAN <hej@ribban.co>',
  to: 'Recipient Name <hej@sajn.se>',
  subject: 'Email with sender name',
  html: '<p>This email has a display name!</p>',
});
```
