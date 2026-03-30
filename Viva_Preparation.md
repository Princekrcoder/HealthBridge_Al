# 🎤 Viva Preparation Guide: SehatSetu (Frontend & Backend)

*(Yeh script aur points design kiye gaye hain taaki aap apne project ke Frontend aur Backend architecture ko asani se apni Ma'am ko samjha sakein, AI part ko avoid karte hue.)*

---

## 1. Project Overview (Introduction)

**Ma'am / Sir ko kya bolna hai:**
"Good morning Ma'am. Mera project **SehatSetu** hai. Yeh ek full-stack healthcare management platform hai. Iska main goal hai citizens (khaskar rural areas) ko doctors aur ASHA workers ke saath connect karna. Is project mein maine ek scalable aur secure web application banayi hai jisme 6 alag-alag user roles hain: Admin, ASHA worker, Citizen, Doctor, Clinical, aur Sub-Center."

---

## 2. Frontend Architecture (Mera User Interface)

**Kya bolna hai:**
"Frontend develop karne ke liye maine **Next.js (App Router)** ka use kiya hai. Next.js isliye chuna kyunki yeh fast routing aur server-side rendering support karta hai, jisse performance better milti hai. 
- Styling ke liye **Tailwind CSS** aur **Shadcn UI** components use kiye hain, jo ek modern, clean aur responsive design provide karte hain.
- Forms aur user input ko handle karne ke liye **React Hook Form** aur **Zod** ka use kiya hai, jo strict validation ensure karte hain, matlab koi bhi galat data submit nahi kar sakta.
- Dashboard mein charts aur data dikhane ke liye maine **Recharts** library ka use kiya hai."

---

## 3. Backend Architecture (Server & Database)

**Kya bolna hai:**
"Backend ke liye maine **Node.js** aur **Express.js** ka framework banaya hai.
- **Database:** Maine **PostgreSQL** ka use kiya hai kyunki healthcare data bahut structured hota hai aur RDBMS uske liye best hai.
- **Authentication & Security:** Security ke liye maine **JWT (JSON Web Tokens)** ka use kiya hai. Password seedhe nahi store hote, unko **bcrypt.js** se hash karke database mein rakha gaya hai taaki pura data secure rahe.
- **Role-Based Access Control (RBAC):** Ek sabse important feature hai 'Role-Based Middleware'. Iska matlab ASHA worker sirf patients ka basic data dekh sakti hai, Doctor medical data assess kar sakta hai, aur Admin pura system manage kar sakta hai. Koi bhi user doosre role ki API access nahi kar sakta.
- **Storage:** Agar patients ki koi medical record ya image hoti hai to use store karne ke liye maine AWS S3 Object Storage ka integration kiya hai."

---

## 4. Work Flow Example (Ek chota use-case)

**Agar Ma'am poochein: "Yeh kaam kaise karta hai? Ek flow batao."**
"Agar ek nayi user (Citizen) aati hai, woh register karti hai. ASHA worker uski regular health updates (forms) backend API ke through submit karti hai. Woh data Postgres DB mein save hota hai. Jab Doctor login karta hai, to Backend API wahi data extract karke doctor ke dashboard (Recharts aur Tables) par show karti hai, jahan se doctor use review kar sakta hai. Sab kuch real-time aur encrypted tokens ke through verify hota hai."

---

## 5. Technical Details (In-depth for Ma'am/Sir)

Agar aapki teacher tech me deep jaati hain (jaise ki **"Kaunsa hook use kiya?" "Tailwind me kya likha?" "Node backend me exactly kya karta hai?"**), to aap aise samjha sakte hain:

### Frontend: React Hooks 🪝
- **`useState`:** Component ke andar data (state) store karne ke liye use kiya hai. Jaise, abhi dashboard ka filter 'High Risk' par hai ya nahi, ya kon sa tab selected hai, woh `useState` handle karta hai.
- **`useEffect`:** Component load (mount) hone par APIs se data lana (fetch) karna iska kaam hai. Jaise hi dashboard open hota hai, `useEffect` backend ko request bhej kar patients ka data le aata hai bina pura page reload kiye.
- **`useMemo` & `useCallback`:** Performance optimize karne ke liye use hain. Jaise jab dashboard me patient list filter karna ho (search box se), toh `useMemo` calculation ko cache kar leta hai taaki app slow na ho.

### Frontend: Tailwind CSS Classes 🎨
Maine mostly utility-first CSS use ki hai taaki development fast ho aur UI responsive bane. Jo classes commonly use ki hain:
- **Layout ke liye:** `flex`, `flex-col`, `grid`, `gap-4` — Elements ko side-by-side ya columns mein properly aur beautifully arrange karne ke liye.
- **Styling aur Colors:** `bg-primary` (main theme color), `text-muted-foreground` (light grey text), `rounded-lg` (gol corners), `shadow-md` — Isse cards aur panels ko clean aur modern look milti hai bina custom CSS likhe.
- **Responsiveness:** Jaise `md:grid-cols-2` aur `lg:col-span-3`, iska matlab mobile me ek column, medium screen me 2 columns, waise classes jo screen size ke hisaab se layout smoothly badalte hain.

### Backend: Node.js 🟩
- **Node.js Kya kar raha hai?** Node.js hamara Javascript Runtime hai jo backend (server) par chalta hai. Yeh **Non-blocking I/O** par based hota hai, iska matlab agar ek saath bohot saare users (doctors, asha workers) requests bhejte hain, to Node block nahi hota aur tezi se asynchronous requests process kar leta hai piche background mein.

### Backend: Express.js 🚂
- **Express.js Kya kar raha hai?** Node.js mein basic server likhna thoda complex hota hai, isliye **Express.js** framework use kiya. 
  - Yeh backend API ko sundar **Routes** mein divide karta hai (jaise `/api/auth/login`, `/api/dashboard`).
  - Isme **Middlewares** ka bada role hota hai. Jaise har request par JWT verify karna aur role check karna ke admi admin hai ya citizen, ye middlewares manage karte hain taaki post-office ki tarah saari HTTP requests ko protect karke sahi jagah pahonchaya jaye.

---

## 💡 Quick Tips For Viva:
- **Confidence:** Jab AI ki baat na karni ho, to DB ki security (JWT/Password Hashing), Role-Based Access (RBAC) aur Next.js + React Hooks ke in modern features ko apni main taqat banayein.
- **File dikhane ka tarika:** 
  - Agar **backend** ka structure dikhana pade to `backend/server.js` (jahan routes aur middleware hain) dikhayein. 
  - Agar **frontend** dikhana ho toh `frontend/src/app/asha/dashboard/page.jsx` khol kar wahan **`useState`**, **`useEffect`** aur **Tailwind classes** wali lines point karke batayein!
