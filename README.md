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
  UnsendTransport.makeTransport({ apiKey: YOUR_UNSEND_API_KEY })
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
