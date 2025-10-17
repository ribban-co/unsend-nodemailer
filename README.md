# Usesend Nodemailer

> NPM package allowing you to send emails easily with the Usesend API. 

### How to get started

#### 1. Install the package

```bash
npm install @ribban/usesend-nodemailer
```

### Usage

#### Create Nodemailer Transport

```typescript
import { UsesendTransport } from '@ribban/usesend-nodemailer';
import { createTransport } from 'nodemailer';

const mailer = createTransport(
  UsesendTransport.makeTransport({
    apiKey: YOUR_USESEND_API_KEY
  })
);
```

#### Custom API Endpoint (Optional)
If you need to use a custom Usesend API endpoint (e.g., self-hosted instance):

```typescript
const mailer = createTransport(
  UsesendTransport.makeTransport({
    apiKey: YOUR_USESEND_API_KEY,
    apiUrl: 'https://your-custom-endpoint.com'  // Default is 'https://api.usesend.dev'
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
