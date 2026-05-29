#!/usr/bin/env node
(async () => {
  const base = 'http://localhost:3002';
  const adminPass = 'admin123';

  try {
    const loginRes = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPass })
    });
    console.log('/api/admin/login ->', loginRes.status);
    if (!loginRes.ok) {
      console.error('Admin login failed');
      process.exit(1);
    }

    const fd = new FormData();
    fd.append('name', 'Smoke Test Product');
    fd.append('price', '9.99');
    fd.append('description', 'Created by smoke-test script');
    fd.append('category', 'Smoke');

    const createRes = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPass },
      body: fd
    });
    const createBody = await createRes.json().catch(() => null);
    console.log('/api/products POST ->', createRes.status, createBody);
    if (!createRes.ok) process.exit(1);

    const id = createBody?.product?.id;
    if (!id) {
      console.error('No product id returned; aborting delete step.');
      process.exit(1);
    }

    const delRes = await fetch(`${base}/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPass }
    });
    const delBody = await delRes.json().catch(() => null);
    console.log(`/api/products/${id} DELETE ->`, delRes.status, delBody);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
