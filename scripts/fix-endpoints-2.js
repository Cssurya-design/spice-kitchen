import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/pages/List/List.jsx',
  'src/pages/Checkout/Checkout.jsx',
  'src/pages/Dashboard/Dashboard.jsx',
  'src/pages/Orders/Orders.jsx',
  'src/pages/Settings/Settings.jsx',
  'src/pages/Offers/Offers.jsx',
  'src/pages/Static/Contact.jsx'
];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  const replacements = [
    { from: /`food-items\/\$\{foodId\}\/`/g, to: '`food-items?id=${foodId}`' },
    { from: /`food-items\/\$\{item\.id\}\/`/g, to: '`food-items?id=${item.id}`' },
    { from: /`users\/\$\{user\.id\}\/`/g, to: '`users/update`' },
    { from: /`orders\/\$\{orderId\}\/`/g, to: '`orders?id=${orderId}`' },
    { from: /`settings\/\$\{settings\.id\}\/`/g, to: '`settings?id=${settings.id}`' },
    { from: /'users\/send_offer\/'/g, to: "'users/send_offer'" },
    { from: /'contact\/'/g, to: "'contact'" }
  ];

  replacements.forEach(r => {
    if (r.from.test(content)) {
      content = content.replace(r.from, r.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Updated', file);
  }
});
