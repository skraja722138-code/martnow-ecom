const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3002;

const dataDir = path.join(__dirname, 'data');
const productsFile = path.join(dataDir, 'products.json');
const uploadDir = path.join(__dirname, 'public', 'uploads');
const adminPassword = 'admin123';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});

// Accept common image types and cap uploads to 10MB to support phone photos
function imageFileFilter(req, file, cb) {
  const allowed = /^(image\/jpeg|image\/png|image\/gif|image\/webp|image\/svg\+xml)$/i;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(productsFile)) {
    fs.writeFileSync(productsFile, JSON.stringify([
      {
        id: 'p1',
        name: 'Classic Sneakers',
        category: 'Fashion',
        price: 499.00,
        description: 'Comfortable shoes for daily wear.',
        imageUrl: '/uploads/sample-sneakers.svg'
      },
      {
        id: 'p2',
        name: 'Leather Wallet',
        category: 'Accessories',
        price: 299.00,
        description: 'Premium wallet with card slots and a coin pocket.',
        imageUrl: '/uploads/sample-wallet.svg'
      }
    ], null, 2));
  }
}

function readProducts() {
  ensureDataFiles();
  const raw = fs.readFileSync(productsFile, 'utf8');
  return JSON.parse(raw || '[]');
}

function writeProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

function checkAdmin(req, res) {
  const password = req.headers['x-admin-password'];
  if (password !== adminPassword) {
    res.status(401).json({ success: false, message: 'Invalid admin password' });
    return false;
  }
  return true;
}

app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.post('/api/products', upload.single('image'), (req, res) => {
  if (!checkAdmin(req, res)) return;

  const { name, price, description, category } = req.body;
  if (!name || !price) {
    res.status(400).json({ success: false, message: 'Product name and price are required.' });
    return;
  }

  const products = readProducts();
  const newItem = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    category: category ? category.trim() : 'General',
    price: parseFloat(price),
    description: description ? description.trim() : '',
    imageUrl: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-product.svg'
  };

  products.unshift(newItem);
  writeProducts(products);
  res.json({ success: true, product: newItem });
});

app.delete('/api/products/:id', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const products = readProducts();
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const [removed] = products.splice(index, 1);
  writeProducts(products);
  res.json({ success: true, removed });
});

// Explicit routes for client pages so paths like /admin and /user work
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Fallback to the main SPA page for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataFiles();

function listLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = listLocalIPs();
  console.log(`E-commerce app running on port ${PORT}`);
  console.log(` - Local: http://localhost:${PORT}`);
  if (ips.length) console.log(` - On your network: ${ips.map(ip => `http://${ip}:${PORT}`).join(', ')}`);
});
