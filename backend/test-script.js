async function run() {
    try {
        const loginRes = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "citizen1@test.com", password: "password" })
        });
        const loginData = await loginRes.json();
        const cookie = loginRes.headers.get('set-cookie') || '';
        console.log("Login Cookie:", cookie);
        
        const summaryRes = await fetch("http://localhost:5000/api/dashboard/summary", {
            headers: { cookie }
        });
        console.log("SUMMARY STATUS:", summaryRes.status, await summaryRes.text());

        const dataRes = await fetch("http://localhost:5000/api/dashboard/citizen", {
            headers: { cookie }
        });
        console.log("DATA STATUS:", dataRes.status, await dataRes.text());
        
        const historyRes = await fetch("http://localhost:5000/api/health-query/history", {
            headers: { cookie }
        });
        console.log("HISTORY STATUS:", historyRes.status, await historyRes.text());
    } catch(e) {
        console.error(e);
    }
}
run();
