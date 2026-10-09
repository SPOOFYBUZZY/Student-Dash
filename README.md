# Student Intelligence

A responsive, frontend-only student analytics prototype for faculty and students. All sample records and supported demo edits are stored in the current browser; authentication is simulated and does not provide production security.

## Run locally

```sh
npm install
npm run dev
```

Create a production bundle with `npm run build`, or preview it with `npm run preview`.

## Vercel deployment

This is a Vite single-page application. Configure the Vercel project with the repository root as the Root Directory, the **Vite** Framework Preset, `npm run build` as the Build Command, and `dist` as the Output Directory. The root `vercel.json` serves the SPA entry point for client-side routes while leaving `/api` requests out of the fallback.

## Demo roles

Visit `/login`, enter any valid email and a password of at least six characters, then choose **Faculty** or **Student**. Use the profile menu to switch roles. Student views are restricted to the sample student, Aarav Mehta. Use **Reset demo data** by clearing this site's local storage to restore the original sample records.

The prediction center contains explicitly labeled synthetic demo indicators; it does not run an AI model. File uploads, email delivery, and live API calls are not connected.

## API integration

The Axios client is isolated in `src/services.ts`. Set `VITE_API_URL` (see `.env.example`) when a backend is available. Demo state persistence is kept separate from that service boundary.

## Main routes

- Faculty: `/faculty/dashboard`, `/faculty/students`, `/faculty/attendance`, `/faculty/assessments`, `/faculty/assignments`, `/faculty/skills`, `/faculty/projects`, `/faculty/analytics`, `/faculty/predictions`, `/faculty/mentoring`, `/faculty/reports`, `/settings`
- Student: `/student/dashboard`, `/student/assessments`, `/student/portfolio`
- Authentication: `/login`, `/forgot-password`

Students can submit self-reported skills and knowledge from **My portfolio**, including a description and optional evidence. Submissions stay marked **Pending review** until faculty reviews them in **Skill mapping**. Faculty can approve a submission or request changes with feedback; students can see the decision and resubmit requested changes. Approval is stored in the local demo workspace and does not represent an externally verified credential.
# Student-Dash
