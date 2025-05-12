This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 🎨 Real-Time Collaborative Drawing Board

A web-based collaborative drawing tool where multiple users can draw together in real-time. Built with React, Next.js, and Socket.IO, this app is ideal for remote teams, artists, and students who need a fast, shared whiteboard experience.

---

## 🚀 Features

- 🔐 Google Sign-In with Firebase Authentication
- 🎯 Create or join a unique drawing room via code
- ✏️ Real-time collaborative drawing with live updates
- 🖍️ Color picker and eraser tool
- 👥 See live usernames and cursor positions
- 📥 Download canvas as an image
- ♻️ Clear board functionality
- 🔄 Drawing history restoration for late joiners

## 🧱 Tech Stack

### Frontend:
- [Next.js](https://nextjs.org/) (React Framework)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase Auth](https://firebase.google.com/)
- [Socket.IO Client](https://socket.io/)

### Backend:
- [Node.js](https://nodejs.org/)
- [Socket.IO Server](https://socket.io/)

### Drawing:
- HTML5 Canvas API

## Getting Started
First, install the library
```bash
npm install
```

Second, run the development server:

```bash
npm run dev
```

Third, run the backend server (socket)
```bash
node app.js
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


Developed by **Olena Molla, Huynh Pham, Thanh Pham, and Kenzo Khowdee.** 




You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
