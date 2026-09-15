import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_users', JSON\.stringify\(users\)\);\s+\}, \[users\]\);/g, 
  `useEffect(() => {
    localStorage.setItem('corpgastos_users', JSON.stringify(users));
    dispatchCloudSave({ users });
  }, [users]);`);

code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_company', JSON\.stringify\(company\)\);\s+\}, \[company\]\);/g,
  `useEffect(() => {
    localStorage.setItem('corpgastos_company', JSON.stringify(company));
    dispatchCloudSave({ company });
  }, [company]);`);

code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_cost_centers', JSON\.stringify\(costCenters\)\);\s+\}, \[costCenters\]\);/g,
  `useEffect(() => {
    localStorage.setItem('corpgastos_cost_centers', JSON.stringify(costCenters));
    dispatchCloudSave({ costCenters });
  }, [costCenters]);`);

code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_rendiciones', JSON\.stringify\(rendiciones\)\);\s+\}, \[rendiciones\]\);/g,
  `useEffect(() => {
    localStorage.setItem('corpgastos_rendiciones', JSON.stringify(rendiciones));
    dispatchCloudSave({ rendiciones });
  }, [rendiciones]);`);

code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_surplus_expenses', JSON\.stringify\(surplusExpenses\)\);\s+\}, \[surplusExpenses\]\);/g,
  `useEffect(() => {
    localStorage.setItem('corpgastos_surplus_expenses', JSON.stringify(surplusExpenses));
    dispatchCloudSave({ surplusExpenses });
  }, [surplusExpenses]);`);

code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_notifications', JSON\.stringify\(notifications\)\);\s+\}, \[notifications\]\);/g,
  `useEffect(() => {
    localStorage.setItem('corpgastos_notifications', JSON.stringify(notifications));
    dispatchCloudSave({ notifications });
  }, [notifications]);`);

// Destinatario accounts is slightly different maybe
code = code.replace(/useEffect\(\(\) => \{\s+localStorage\.setItem\('corpgastos_destinatario_accounts', JSON\.stringify\(destinatarioAccounts\)\);\s+\}, \[destinatarioAccounts\]\);/g,
  `useEffect(() => {
    localStorage.setItem('corpgastos_destinatario_accounts', JSON.stringify(destinatarioAccounts));
    dispatchCloudSave({ destinatarioAccounts });
  }, [destinatarioAccounts]);`);

fs.writeFileSync('src/App.tsx', code);
