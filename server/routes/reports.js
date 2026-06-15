const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Create Report (Allows guest or authenticated candidates)
router.post('/', async (req, res) => {
  try {
    const reportData = req.body;

    if (!reportData.candidateName || !reportData.candidateEmail || reportData.score === undefined) {
      return res.status(400).json({ message: 'Missing required report fields' });
    }

    // Check if there is an authenticated user linking this report
    let candidateId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';
        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];
        const decoded = jwt.verify(token, JWT_SECRET);
        candidateId = decoded.id;
      } catch (e) {
        // Fallback to guest submission
      }
    }

    const reportId = reportData.id || `APP-${Math.floor(Math.random() * 10000)}`;

    const newReport = new Report({
      id: reportId,
      candidateId,
      jobId: reportData.jobId || 'GENERAL',
      candidateName: reportData.candidateName,
      candidateEmail: reportData.candidateEmail,
      score: reportData.score,
      track: reportData.track || 'JS',
      violations: reportData.violations || [],
      koyoSignals: reportData.koyoSignals || [],
      proctoringLogs: reportData.proctoringLogs || [],
      timestamp: reportData.timestamp || new Date(),
      simulation: reportData.simulation || {},
      report: reportData.report || {}
    });

    await newReport.save();
    res.status(201).json({ message: 'Report saved successfully', report: newReport });

  } catch (err) {
    console.error('Report submission error:', err);
    res.status(500).json({ message: 'Internal server error saving report' });
  }
});

// Fetch Reports (Protected: controls access by role)
router.get('/', auth, async (req, res) => {
  try {
    const { id, role } = req.user;

    // Get current user details
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role === 'founder') {
      // Founder has global access to all reports
      const reports = await Report.find().sort({ timestamp: -1 });
      return res.json(reports);
    } 
    
    if (role === 'recruiter') {
      // Recruiter sees reports under their organization, or all if organization is not configured
      let query = {};
      if (user.organization) {
        // Find users in the same organization
        const orgUsers = await User.find({ organization: user.organization }).select('_id');
        const orgUserIds = orgUsers.map(u => u._id);
        query = { candidateId: { $in: orgUserIds } };
      }
      // Or fallback to all reports if no organization is specified
      const reports = await Report.find(query).sort({ timestamp: -1 });
      return res.json(reports);
    }

    if (role === 'candidate') {
      // Candidate can only see their own reports by id or email
      const reports = await Report.find({
        $or: [
          { candidateId: id },
          { candidateEmail: user.email }
        ]
      }).sort({ timestamp: -1 });
      return res.json(reports);
    }

    res.status(403).json({ message: 'Forbidden' });

  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ message: 'Internal server error fetching reports' });
  }
});

// Fetch Specific Report Details
router.get('/:reportId', auth, async (req, res) => {
  try {
    const { id, role } = req.user;
    const report = await Report.findOne({ id: req.params.reportId });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Role verification
    if (role === 'candidate') {
      const user = await User.findById(id);
      if (!user || (report.candidateEmail !== user.email && String(report.candidateId) !== id)) {
        return res.status(403).json({ message: 'Access denied to this report' });
      }
    }

    res.json(report);

  } catch (err) {
    console.error('Fetch report detail error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
