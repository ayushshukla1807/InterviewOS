const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

// Load .env.local dynamically
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.warn('Could not load .env.local file:', e.message);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in environment or .env.local');
  process.exit(1);
}

const SimulationReportSchema = new mongoose.Schema({}, { strict: false });
const SimulationReport = mongoose.models.SimulationReport || mongoose.model('SimulationReport', SimulationReportSchema, 'simulationreports');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const reports = await SimulationReport.find({});
    console.log('Total reports:', reports.length);

    let count = 0;
    for (const r of reports) {
      count++;
      const data = r.toObject();
      console.log(`Report #${count}: ID=${data._id}, Name=${data.candidateName}, CreatedAt=${data.createdAt}`);
      
      try {
        if (!data.createdAt) {
          console.warn('  --> WARNING: Missing createdAt!');
        } else {
          const d = new Date(data.createdAt);
          if (isNaN(d.getTime())) {
            console.error('  --> ERROR: Invalid createdAt date value:', data.createdAt);
          } else {
            d.toISOString();
          }
        }
      } catch (err) {
        console.error('  --> CRASH ERROR toISOString():', err.message);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
