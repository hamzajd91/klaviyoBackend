const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect } = require('../middlewares/authMiddleware');
const Campaign = require("../models/campaign");

const { 
  getCampaigns,
  getProfiles,
  getList,
  getFlows,
  getMetrics,
  getMatrixKey,
  getCatalogs
  
 } = require("../services/klaviyoService");

const { 
  fetchCampaignData, 
  fetchCampaignById, 
  saveMatrixKey, 
  fetchStatsKlaviyo,
  fetchCampaignMessage,
  fetchMessageTemplate,
  refine_campaigns,
  fetchRefinedCampaignData,
  fetchCampaignByCampaignId

} = require("../controllers/campaignsController");

router.get('/fetchCampaigns', fetchCampaignData);
router.get('/fetchRefinedCampaignData', fetchRefinedCampaignData);
router.post('/byId', fetchCampaignById);
router.get("/campaign/:campaignId", fetchCampaignByCampaignId);
router.post('/saveMatrixKey', saveMatrixKey);
router.post('/fetchStatsKlaviyo', fetchStatsKlaviyo);
router.get('/fetchCampaignMessage/:messageId', fetchCampaignMessage);
router.get('/fetchMessageTemplate', fetchMessageTemplate);
router.post('/refine_campaigns', refine_campaigns);



// router.get('/paginated', async (req, res) => {
//   const { userId, page = 1, limit = 10 } = req.query;
//   if (!userId) return res.status(400).json({ message: 'userId is required' });

//   try {
//     console.log('Paginate filter on id:', userId);
//     const result = await Campaign.paginate({ id: userId }, {
//       page: +page, limit: +limit, sort: { createdAt: -1 }, lean: true
//     });

//     res.json({ items: result.docs, totalPages: result.totalPages });
//   } catch (err) {
//     console.error('Pagination handler error:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

router.get('/paginated', async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId is required' });

  try {
    const doc = await Campaign.findOne({ id: userId }).lean();
    if (!doc) return res.status(404).json({ message: 'Campaign not found' });

    const raw = Array.isArray(doc.raw_data) ? doc.raw_data : [];
    const total = raw.length;
    const totalPages = Math.ceil(total / limit);
    const pageNum = Math.max(1, parseInt(page, 10));
    const lim = Math.max(1, parseInt(limit, 10));

    const start = (pageNum - 1) * lim;
    const items = raw.slice(start, start + lim);

    res.json({
      items,
      page: pageNum,
      totalPages,
      total,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    });
  } catch (err) {
    console.error('Pagination error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await getCampaigns();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

router.post("/fetch-campaign-data", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const campaigns = await getCampaigns(userId);
    res.json(campaigns);
  } catch (err) {
    console.error("Error in /fetch-campaign-data:", err.message);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

router.get("/profiles", async (req, res) => {
  try {
    const data = await getProfiles();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profiles" });
  }
});

router.get("/events", async (req, res) => {
  try {
    const data = await getEvents();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profiles" });
  }
});

router.get("/list", async (req, res) => {
  try {
    const data = await getList();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch list" });
  }
});

router.get("/flows", async (req, res) => {
  try {
    const data = await getFlows();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch flows" });
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const data = await getMetrics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

router.get("/metricsKey", async (req, res) => {
  try {
    const data = await getMatrixKey();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

router.get("/catalogs", async (req, res) => {
  try {
    const data = await getCatalogs();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch catalogs" });
  }
});


module.exports = router;

