[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=21426713)
# COSI 153A: Final Project Guidelines  
**Due Date:** December 9, 2025, at 11:59 PM.   

## Overview
The final project is the culmination of **COSI 153A**, where you will design, build, and deploy a fully functional **mobile application** using **React Native** and **Expo**, connected to your **own backend API** built with **Node.js, Express, and MongoDB**.  
  
The topic of your final project is entirely your choice and you are encouraged to come up with your own unique idea that reflects your interests, creativity, and technical skills.  
  
The goal is to demonstrate your ability to design, implement, and deploy a **complete full-stack application** with:
- Clean, responsive UI  
- Reliable data persistence  
- Integration of at least one device feature via an **Expo API**  

---

## Project Requirements

### General
- **Individual work only**: collaboration or shared codebases are **strictly prohibited**.  
- All code and documentation must be original and verifiable through your GitHub commits.

### Technical Components
| Component | Requirement |
|------------|--------------|
| **Frontend** | React Native (Expo) app with at least three functional screens using React Navigation |
| **Backend** | Custom Node.js + Express + MongoDB API with at least three CRUD routes |
| **Device Feature** | Integrate at least one Expo API (Camera, Audio, Location, Notifications, etc.) |
| **Data Handling** | Demonstrate fetching and posting data between mobile and backend |
| **UI/UX** | Clean, responsive, and intuitive layout using Flexbox and React Native components |
| **Deployment** | Backend hosted on Render or Railway; mobile app published via Expo.dev link |
| **Version Control** | Clear GitHub commit history, descriptive commit messages, and well-structured repo |

---

## Typical Repo Structure
Below is a typical repo structure containing your final project within the **project** folder. Feel free to include any files and folders you find necessary to support extra features for your project. 
```
final-project-<GitHubUserName>/
├─ .autogit/
├─ .devcontainer/
├─ .vscode/
├─ project/                  
│  ├─<your-frontend-project-name>/              # ← Root directory for the final project. Use a clear, descriptive name.
│  │ ├─ app.json                  
│  │ ├─ app/                              
│  │ ├─ package.json              
│  │ ├─ tsconfig.json                       
│  │ ├─                                     # The internal structure of your final project for both frontend and backend is entirely up to you.
│  │                                        # Feel free to include any files and folders you find necessary.
│  └─<your-backend-project-name>
│    ├─ index.js                                               
│    ├─ package.json              
│    ├─                        
│  
├─ scripts/
├─ .DS_Store
├─ .gitignore
├─ LICENSE
├─ README.md
├─ prompts.md
└─ video.md
  
```

---

## Evaluation Rubric (100 Points + 10 Bonus)

| Category | Description | Points |
|-----------|--------------|--------|
| **Functionality & Features** | Completeness, logical flow, and correct behavior | **25** |
| **Code Quality & Architecture** | Modular, readable, and well-orgnaized code | **20** |
| **UI Design & UX** | Visual appeal, layout, and responsiveness | **15** |
| **API Integration** | Proper use of fetch/axios, RESTful design, and error handling | **15** |
| **MongoDB Integration** | Schema design and CRUD data persistence | **15** |
| **Repo Quality & Deployment** | Descriptive commits, installable .apk, and hosted backend| **10** |
| **Bonus: Presentation** | Optional in-class presentation (+10) | **Bonus** |

Note: Final project presentations will take place during Week 13. Prepare in advance if you wish to present your project.

---
<!-- BEGIN GENERAL INSTRUCTIONS -->
## Reminder: 

You must submit three links as part of your final project submission. Refer to [`links.md`](/links.md) for more details.

---

## Responsible Use of AI Tools

You are encouraged to use AI tools (such as Gemini, GitHub Copilot, and ChatGPT) to assist your learning, debug code, and explore best practices. However, AI should be used as a **guide**, not as an **author**. Your final code, explanations, and design decisions must reflect **your own understanding**.

You must:

1. **Do not submit AI-generated code without review.** Each assignment includes a quiz to assess your understanding.
2. **Do not use LLMs to answer conceptual or reflective questions.**
3. **Log all major prompts** in [`prompts.md`](prompts.md). This will be **graded** as part of your submission.
4. **Understand your code** before submitting. If you can't explain it, **don't submit it**.

---

## Feeling Stuck?

Here’s what to do:

1. Review the assignment instructions and example materials posted on Moodle.
2. Post conceptual questions on the **“Ask the Class” forum** on Moodle. Do **not** post code publicly.
3. Search online for error messages or docs related to the assigment.
4. Attend office hours for help.

---

## Submission Instructions

Assignments are submitted via GitHub.
Submitting to GitHub simply means pushing your changes to your repository before the deadline. You may push changes multiple times before the deadline; the latest valid push will be graded.

From your Codespace terminal, run:
   ```bash
   ./scripts/submit.sh
   ```
This will commit and push your changes. Contact staff if this fails.

---

## 💻 Working on Assignments

Each assignment starts from the link posted on Moodle:

1. Click the assignment link.
2. Click **“Accept this assignment”**.
3. Click **“Open in Codespaces”** to launch your dev environment.

You’ll be taken to a fully configured cloud-based VSCode editor. No setup is needed, just log in and start coding. You do need an active internet connection.

---

Good luck and enjoy building your apps!

— Prof. Hadi Mohammadi  
hadi@brandeis.edu

<!-- END GENERAL INSTRUCTIONS -->
