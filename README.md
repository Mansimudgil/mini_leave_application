# Leave Management System

A simple web application for employees to apply for leave (Casual/Sick) and managers to review, approve, or reject requests with automatic leave balance deduction.

---

## 🛠️ Tech Stack
- **Frontend**: React.js (Vite), Plain CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)

---

## 📌 Links
- **GitHub Repository**: `https://github.com/<your-username>/leave-management-system`
- **Live Application**: `https://<your-deployed-app>.vercel.app`

---

## 🎯 Key Features & Edge Cases

1. **Employee Leave Application**:
   - Select leave type: **Casual Leave** or **Sick Leave**.
   - Select date range and provide a mandatory reason.
   - Shows live working days calculation before submitting.

2. **Manager Approval & Balance Deduction**:
   - Manager can view pending requests and click **Approve** or **Reject**.
   - Balance is **deducted only after approval**.

3. **Weekend Handling**:
   - **Approach**: Saturdays and Sundays are considered non-working days and are not deducted from the leave balance.
   - *Example*: A leave from Friday to Monday (4 calendar days) only deducts **2 working days** (Friday & Monday).
   - If an employee selects only Saturday and Sunday (0 working days), the application blocks the request because leaves are not required on off-days.

4. **Overlapping Requests**:
   - Prevents an employee from applying for dates that overlap with an existing pending or approved leave.

5. **Insufficient Balance**:
   - Prevents submission if requested working days exceed the remaining balance.
   - Also re-validates balance before approval to avoid race conditions.

---

## 🤖 AI Tools Disclosure

### Tools Used
- **AI Tool**: Claude (Claude Code)
- **Used For**: Initial project scaffolding, creating Express API routes, setting up React components, and writing tests.

### What Was Generated Incorrectly & Changed
1. **Date Timezone Shift**:
   - The AI initially used `date.toISOString().split('T')[0]` to format dates. In Indian Standard Time (`UTC+5:30`), this shifted dates back by one day (e.g., Oct 2 became Oct 1).
   - **Fix**: Changed to local date component methods (`getFullYear()`, `getMonth()`, `getDate()`) so dates stay accurate.
2. **Weekend-Only Requests**:
   - The initial AI logic allowed 0-day leave requests if someone selected only Saturday and Sunday.
   - **Fix**: Added validation to reject any request where `workingDays === 0`.

---

## 📝 Assumptions
1. Standard work week is Monday to Friday. Saturday and Sunday are off.
2. Initial leave quota is **10 Casual days** and **10 Sick days** per employee.
3. Pre-seeded employee accounts for quick testing:
   - **Aarav Sharma** (`EMP001`, Engineering)
   - **Priya Patel** (`EMP002`, Manager)
   - **Rohan Verma** (`EMP003`, Sales)
   - **Ananya Iyer** (`EMP004`, Design)
   - **Vikram Singh** (`EMP005`, Marketing)
4. A dropdown switcher in the navbar is provided to quickly switch between employee and manager views for demonstration without a login page.

---

## 🚀 How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Steps

1. **Clone the repository**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd leave_application
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Run the project**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

> **Note on Database**: If no `MONGODB_URI` is supplied in `.env`, the backend automatically uses an in-memory MongoDB database so the app runs immediately with zero configuration. To connect to MongoDB Atlas, add `MONGODB_URI=<your-connection-string>` in `server/.env`.

---

## 🧪 Running Tests
To verify all edge cases (weekends, overlaps, balances, approvals):
```bash
node server/test_e2e.js
```
